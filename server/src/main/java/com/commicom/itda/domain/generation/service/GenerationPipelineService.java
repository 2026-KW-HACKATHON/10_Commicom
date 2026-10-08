package com.commicom.itda.domain.generation.service;

import com.commicom.itda.domain.generation.entity.Generation;
import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.global.config.AsyncConfig;
import com.commicom.itda.infra.storage.StorageService;
import com.commicom.itda.infra.video.MasterVideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationPipelineService {

    private final GenerationRepository generationRepository;
    private final ShortformRepository shortformRepository;
    private final MasterVideoService masterVideoService;
    private final StorageService storageService;

    /**
     * 3컷 마스터 영상 생성 파이프라인을 비동기로 실행한다.
     * PENDING → PROCESSING → COMPLETED / FAILED
     */
    @Async(AsyncConfig.VIDEO_GENERATION_EXECUTOR)
    @Transactional
    public void execute(Long generationId, String menuInfo,
                        String menuImg, String interiorImg, String tableImg) {
        Generation generation = generationRepository.findById(generationId).orElse(null);
        if (generation == null) {
            log.error("Generation {} 을 찾을 수 없음", generationId);
            return;
        }

        generation.startProcessing();
        Store store = generation.getStore();
        log.info("[생성 {}] 시작 - {}", generationId, store.getName());

        // 대표 메뉴: menuInfo 첫 단어, 없으면 카테고리 설명
        String signatureMenu = extractFirstWord(menuInfo);
        if (signatureMenu == null || signatureMenu.isBlank()) {
            signatureMenu = store.getCategory().getDescription();
        }

        // null 이미지 폴백
        String effectiveInterior = (interiorImg != null && !interiorImg.isBlank()) ? interiorImg : menuImg;
        String effectiveTable    = (tableImg    != null && !tableImg.isBlank())    ? tableImg    : menuImg;

        File finalVideo = null;
        try {
            // 영상 생성
            finalVideo = masterVideoService.createMasterVideo(
                    menuImg, effectiveInterior, effectiveTable,
                    store.getName(), signatureMenu,
                    store.getAddress(), store.getCategory().name());

            // S3 업로드
            String videoKey = "shortforms/" + UUID.randomUUID() + ".mp4";
            String videoUrl;
            try {
                videoUrl = storageService.uploadFile(finalVideo, videoKey, "video/mp4");
            } catch (Exception e) {
                throw new RuntimeException("S3 업로드 실패: " + e.getMessage(), e);
            }
            log.info("[생성 {}] S3 업로드 완료", generationId);

            // Shortform 저장
            String cleanStoreName = store.getName().replaceFirst("^\\[샘플\\]\\s*", "");
            Shortform shortform = Shortform.builder()
                    .store(store)
                    .videoUrl(videoUrl)
                    .thumbnailUrl(null)
                    .title(cleanStoreName)
                    .script("")
                    .duration(15)
                    .build();
            shortformRepository.save(shortform);

            generation.complete(shortform);
            log.info("[생성 {}] 완료 → shortformId={}", generationId, shortform.getId());

        } catch (Exception e) {
            log.error("[생성 {}] 실패: {}", generationId, e.getMessage(), e);
            generation.fail(e.getMessage());
        } finally {
            if (finalVideo != null) finalVideo.delete();
        }
    }

    private String extractFirstWord(String menuInfo) {
        if (menuInfo == null || menuInfo.isBlank()) return null;
        return menuInfo.split("[,，\\s]+")[0].trim();
    }
}
