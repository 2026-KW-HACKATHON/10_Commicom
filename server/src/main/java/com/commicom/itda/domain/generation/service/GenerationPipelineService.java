package com.commicom.itda.domain.generation.service;

import com.commicom.itda.domain.generation.entity.Generation;
import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.global.config.AsyncConfig;
import com.commicom.itda.infra.ai.BedrockImageService;
import com.commicom.itda.infra.ai.PostCaptionService;
import com.commicom.itda.infra.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationPipelineService {

    private static final String CANCELED_MESSAGE = "사장님이 생성을 취소했어요";

    private final GenerationRepository generationRepository;
    private final ShortformRepository shortformRepository;
    private final BedrockImageService bedrockImageService;
    private final StorageService storageService;
    private final PostCaptionService postCaptionService;
    private final GenerationCancelRegistry cancelRegistry;

    /**
     * AI 이미지 생성 파이프라인을 비동기로 실행한다.
     * PENDING → PROCESSING → COMPLETED / FAILED
     */
    @Async(AsyncConfig.VIDEO_GENERATION_EXECUTOR)
    @Transactional
    public void execute(Long generationId, String menuInfo, String appeal, String referenceImageUrl, List<String> photoUrls) {
        Generation generation = generationRepository.findById(generationId).orElse(null);
        if (generation == null) {
            log.error("Generation {} 을 찾을 수 없음", generationId);
            return;
        }

        if (cancelRegistry.isCanceled(generationId)) {
            generation.fail(CANCELED_MESSAGE);
            cancelRegistry.clear(generationId);
            return;
        }
        generation.startProcessing();
        Store store = generation.getStore();
        log.info("[생성 {}] 시작 - {}", generationId, store.getName());

        File tempFile = null;
        try {
            // AI 이미지 생성
            byte[] imageBytes = bedrockImageService.generateImage(
                    store.getName(),
                    store.getCategory().name(),
                    menuInfo,
                    referenceImageUrl);
            log.info("[생성 {}] AI 이미지 생성 완료 ({}KB)", generationId, imageBytes.length / 1024);

            // 게시물 소개 글: 사장님 어필을 다듬음 (실패하면 어필 그대로)
            String caption = postCaptionService.write(store, appeal, menuInfo);

            // 이미지를 만드는 동안 취소했으면 올리지도 저장하지도 않음
            if (cancelRegistry.isCanceled(generationId)) {
                log.info("[생성 {}] 사장님이 취소함", generationId);
                generation.fail(CANCELED_MESSAGE);
                return;
            }

            // S3 업로드
            tempFile = File.createTempFile("ai-image-", ".png");
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(imageBytes);
            }

            String imageKey = "shortforms/" + UUID.randomUUID() + ".png";
            String imageUrl = storageService.uploadFile(tempFile, imageKey, "image/png");
            log.info("[생성 {}] S3 업로드 완료", generationId);

            // Shortform 저장
            String cleanStoreName = store.getName().replaceFirst("^\\[샘플\\]\\s*", "");
            Shortform shortform = Shortform.builder()
                    .store(store)
                    .imageUrl(imageUrl)
                    .title(cleanStoreName)
                    .caption(caption)
                    .photoUrls(photoUrls)
                    // 사장님이 결과를 보고 [업로드]해야 손님 피드에 보임
                    .published(false)
                    .build();
            shortformRepository.save(shortform);

            generation.complete(shortform);
            log.info("[생성 {}] 완료 → shortformId={}", generationId, shortform.getId());

        } catch (Exception e) {
            log.error("[생성 {}] 실패: {}", generationId, e.getMessage(), e);
            generation.fail(e.getMessage());
        } finally {
            if (tempFile != null) tempFile.delete();
            cancelRegistry.clear(generationId);
        }
    }
}
