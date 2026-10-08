package com.commicom.itda.domain.scrap.service;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.scrap.dto.ScrapListResponse;
import com.commicom.itda.domain.scrap.dto.ScrapStoreResponse;
import com.commicom.itda.domain.scrap.entity.Scrap;
import com.commicom.itda.domain.scrap.repository.ScrapRepository;
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
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final MemberRepository memberRepository;
    private final StoreRepository storeRepository;

    @Transactional
    public ScrapStoreResponse addScrap(Long memberId, Long storeId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if (scrapRepository.existsByMemberAndStore(member, store)) {
            throw new BusinessException(ErrorCode.SCRAP_ALREADY_EXISTS);
        }

        Scrap scrap = Scrap.builder()
                .member(member)
                .store(store)
                .build();
        scrapRepository.save(scrap);

        return ScrapStoreResponse.from(scrap);
    }

    @Transactional
    public void removeScrap(Long memberId, Long storeId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        Scrap scrap = scrapRepository.findByMemberAndStore(member, store)
                .orElseThrow(() -> new BusinessException(ErrorCode.SCRAP_NOT_FOUND));

        scrapRepository.delete(scrap);
    }

    @Transactional(readOnly = true)
    public ScrapListResponse getMyScraps(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        List<ScrapStoreResponse> scraps = scrapRepository.findAllByMemberOrderByCreatedAtDesc(member)
                .stream().map(ScrapStoreResponse::from).toList();

        return new ScrapListResponse(scraps.size(), scraps);
    }
}
