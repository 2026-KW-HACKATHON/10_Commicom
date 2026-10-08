package com.commicom.itda.domain.generation.service;

import com.commicom.itda.domain.generation.dto.GenerationRequest;
import com.commicom.itda.domain.generation.dto.GenerationResponse;
import com.commicom.itda.domain.generation.dto.GenerationStatusResponse;
import com.commicom.itda.domain.generation.entity.Generation;
import com.commicom.itda.domain.generation.entity.GenerationStatus;
import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.infra.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GenerationService {

    private final GenerationRepository generationRepository;
    private final StoreRepository storeRepository;
    private final MemberRepository memberRepository;
    private final GenerationPipelineService pipelineService;
    private final StorageService storageService;

    @Transactional
    public GenerationResponse requestGeneration(Long memberId, GenerationRequest request) {
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        boolean hasActiveRequest = generationRepository.existsByStoreAndStatusIn(
                store, List.of(GenerationStatus.PENDING, GenerationStatus.PROCESSING));
        if (hasActiveRequest) {
            throw new BusinessException(ErrorCode.GENERATION_CONFLICT);
        }

        Generation generation = Generation.builder()
                .store(store)
                .requestedBy(member)
                .status(GenerationStatus.PENDING)
                .build();
        generationRepository.save(generation);

        // 트랜잭션 커밋 완료 후에 비동기 파이프라인 실행 (커밋 전엔 DB에서 못 찾음)
        Long generationId = generation.getId();
        String menuInfo = request.menuInfo();
        String menuImageUrl = request.menuImageUrl();
        // 게시물에 넣을 사장님 사진: 이 가게 사진 폴더에 올라간 것만 (POST /api/stores/{storeId}/photos)
        List<String> photoUrls = request.photoUrls() == null ? List.of()
                : request.photoUrls().stream().filter(u -> storageService.isUploadedUnder(u, "stores/" + store.getId())).toList();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                pipelineService.execute(generationId, menuInfo, menuImageUrl, photoUrls);
            }
        });

        return GenerationResponse.from(generation);
    }

    @Transactional(readOnly = true)
    public GenerationStatusResponse getStatus(Long memberId, Long generationId) {
        Generation generation = generationRepository.findById(generationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GENERATION_NOT_FOUND));

        if (!generation.getRequestedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.GENERATION_FORBIDDEN);
        }

        return GenerationStatusResponse.from(generation);
    }
}
