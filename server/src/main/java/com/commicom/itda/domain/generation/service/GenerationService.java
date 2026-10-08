package com.commicom.itda.domain.generation.service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GenerationService {

    private final GenerationRepository generationRepository;
    private final StoreRepository storeRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public GenerationResponse requestGeneration(Long memberId, Long storeId) {
        Store store = storeRepository.findById(storeId)
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
