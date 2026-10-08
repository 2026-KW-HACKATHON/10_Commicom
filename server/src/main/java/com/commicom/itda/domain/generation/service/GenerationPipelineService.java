package com.commicom.itda.domain.generation.service;

import com.commicom.itda.domain.generation.entity.Generation;
import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.global.config.AsyncConfig;
import com.commicom.itda.infra.ai.AiService;
import com.commicom.itda.infra.image.ImageService;
import com.commicom.itda.infra.scraping.ScrapingService;
import com.commicom.itda.infra.storage.StorageService;
import com.commicom.itda.infra.tts.TtsService;
import com.commicom.itda.infra.video.VideoService;
import com.commicom.itda.infra.video.VideoService.VideoResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationPipelineService {

    private final GenerationRepository generationRepository;
    private final ShortformRepository shortformRepository;
    private final ScrapingService scrapingService;
    private final AiService aiService;
    private final TtsService ttsService;
    private final VideoService videoService;
    private final StorageService storageService;
    private final ImageService imageService;

    /**
     * AI 숏폼 생성 파이프라인을 비동기로 실행한다.
     * PENDING → PROCESSING → COMPLETED / FAILED
     *
     * 파이프라인:
     * 1. 스크래핑 (가게 메뉴 정보)
     * 2. AI 스크립트 생성 (Bedrock)
     * 3. TTS 음성 합성 (Polly)
     * 4. 영상 생성 (photoUrls 있으면 Runway AI, 없으면 Unsplash 슬라이드쇼)
     * 5. S3 업로드
     * 6. Shortform 저장
     */
    @Async(AsyncConfig.VIDEO_GENERATION_EXECUTOR)
    @Transactional
    public void execute(Long generationId, String menuInfo, List<String> photoUrls) {
        Generation generation = generationRepository.findById(generationId).orElse(null);
        if (generation == null) {
            log.error("Generation {} 을 찾을 수 없음", generationId);
            return;
        }

        generation.startProcessing();
        Store store = generation.getStore();
        log.info("[생성 {}] 시작 - {}", generationId, store.getName());

        VideoResult videoResult = null;
        try {
            // 1. 스크래핑 (실패해도 계속)
            String scrapedMenu = scrapingService.scrapeMenuInfo(store.getName(), store.getAddress());
            String combinedMenuInfo = combineMenuInfo(menuInfo, scrapedMenu);
            log.info("[생성 {}] 스크래핑 완료", generationId);

            // 2. AI 스크립트 생성
            AiService.ScriptResult scriptResult = aiService.generateScript(store, combinedMenuInfo);
            log.info("[생성 {}] 스크립트 생성 완료: {}", generationId, scriptResult.title());

            // 3. TTS 음성 합성
            byte[] audioBytes = ttsService.synthesize(scriptResult.script());
            int durationSec = Math.max(5, audioBytes.length / 16_000);
            log.info("[생성 {}] TTS 완료 (추정 {}초)", generationId, durationSec);

            // 4. 영상 생성
            String bgColor = VideoService.categoryColor(store.getCategory().name());
            java.nio.file.Path mediaWorkPath = java.nio.file.Files.createTempDirectory("media-");
            boolean hasPhotos = photoUrls != null && !photoUrls.isEmpty();

            if (hasPhotos) {
                // 사진 URL → 슬라이드쇼 (Runway 없이 즉시 생성)
                log.info("[생성 {}] 슬라이드쇼 생성 시작 (사진 {}장)", generationId, photoUrls.size());
                List<java.io.File> bgImages = imageService.downloadImages(photoUrls, mediaWorkPath);
                if (bgImages.size() >= 2) {
                    videoResult = videoService.createSlideshowVideo(audioBytes, bgImages, scriptResult.title());
                } else if (!bgImages.isEmpty()) {
                    videoResult = videoService.createVideo(audioBytes, bgColor, bgImages.get(0));
                } else {
                    videoResult = videoService.createVideo(audioBytes, bgColor, null);
                }
            } else {
                // 사진 없음 → Unsplash 슬라이드쇼 폴백
                log.info("[생성 {}] Unsplash 슬라이드쇼 폴백", generationId);
                List<java.io.File> bgImages = imageService.fetchBackgroundImages(
                        store.getCategory().name(), 12, mediaWorkPath);
                if (bgImages.size() >= 2) {
                    videoResult = videoService.createSlideshowVideo(audioBytes, bgImages, scriptResult.title());
                } else {
                    java.io.File bgImage = bgImages.isEmpty() ? null : bgImages.get(0);
                    videoResult = videoService.createVideo(audioBytes, bgColor, bgImage);
                }
            }
            log.info("[생성 {}] 영상 생성 완료 ({}초)", generationId, videoResult.durationSec());

            // 6. S3 업로드
            String videoKey = "shortforms/" + UUID.randomUUID() + ".mp4";
            String videoUrl = storageService.uploadFile(videoResult.videoFile(), videoKey, "video/mp4");

            String thumbnailUrl = null;
            if (videoResult.thumbnailFile().exists()) {
                String thumbKey = "thumbnails/" + UUID.randomUUID() + ".jpg";
                thumbnailUrl = storageService.uploadFile(videoResult.thumbnailFile(), thumbKey, "image/jpeg");
            }
            log.info("[생성 {}] S3 업로드 완료", generationId);

            // 6. Shortform 저장
            Shortform shortform = Shortform.builder()
                    .store(store)
                    .videoUrl(videoUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .title(scriptResult.title())
                    .script(scriptResult.script())
                    .duration(videoResult.durationSec())
                    .build();
            shortformRepository.save(shortform);

            generation.complete(shortform);
            log.info("[생성 {}] 완료 → shortformId={}", generationId, shortform.getId());

        } catch (Exception e) {
            log.error("[생성 {}] 실패: {}", generationId, e.getMessage(), e);
            generation.fail(e.getMessage());
        } finally {
            if (videoResult != null) videoResult.cleanup();
        }
    }

    private String combineMenuInfo(String fromRequest, String fromScraping) {
        if (fromRequest == null) fromRequest = "";
        if (fromScraping == null) fromScraping = "";
        String combined = (fromRequest + " " + fromScraping).trim();
        return combined.isBlank() ? "정보 없음" : combined;
    }
}
