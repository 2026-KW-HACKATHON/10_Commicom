package com.commicom.itda.domain.shortform.service;

import com.commicom.itda.domain.generation.entity.Generation;
import com.commicom.itda.domain.generation.repository.GenerationRepository;
import com.commicom.itda.domain.pro.repository.ProSubscriptionRepository;
import com.commicom.itda.domain.scrap.entity.ShortformScrap;
import com.commicom.itda.domain.scrap.repository.ShortformScrapRepository;
import com.commicom.itda.domain.shortform.dto.ShortformDetailResponse;
import com.commicom.itda.domain.shortform.dto.ShortformFeedResponse;
import com.commicom.itda.domain.shortform.dto.ShortformSummaryResponse;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShortformService {

    private final ShortformRepository shortformRepository;
    private final StoreRepository storeRepository;
    private final ProSubscriptionRepository proSubscriptionRepository;
    private final ShortformScrapRepository shortformScrapRepository;
    private final GenerationRepository generationRepository;

    public ShortformFeedResponse getFeed(Long storeId, int page, int size) {
        LocalDateTime now = KstTime.now();
        Page<Shortform> shortformPage;
        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            shortformPage = shortformRepository.findAllByStoreAndPublishedTrue(store, pageable);
        } else {
            // PRO 혜택 "피드 우선 노출": PRO 가게 게시물이 먼저 (정렬은 쿼리에 있음)
            shortformPage = shortformRepository.findFeedProFirst(now, PageRequest.of(page, size));
        }

        Set<Long> proStoreIds = new HashSet<>(proSubscriptionRepository.findActiveStoreIds(now));
        List<ShortformSummaryResponse> shortforms = shortformPage.getContent().stream()
                .map(s -> ShortformSummaryResponse.from(s, proStoreIds.contains(s.getStore().getId())))
                .toList();

        return new ShortformFeedResponse(
                (int) shortformPage.getTotalElements(),
                page,
                size,
                shortformPage.hasNext(),
                shortforms
        );
    }

    public ShortformDetailResponse getShortform(Long shortformId) {
        Shortform shortform = shortformRepository.findById(shortformId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHORTFORM_NOT_FOUND));
        return ShortformDetailResponse.from(shortform);
    }

    /** 만든 게시물을 손님 피드에 공개 ([업로드]) */
    @Transactional
    public ShortformDetailResponse publish(Long memberId, Long shortformId) {
        Shortform shortform = findMine(memberId, shortformId);
        shortform.publish();
        return ShortformDetailResponse.from(shortform);
    }

    /** 게시물 삭제 (내 가게만). 스크랩·사진은 같이 지우고 생성 기록은 연결만 끊음 */
    @Transactional
    public void delete(Long memberId, Long shortformId) {
        remove(findMine(memberId, shortformId));
    }

    /**
     * 올린 게시물(oldId)을 재수정한 새 버전(newId)으로 바꿈: 새 버전을 공개하고 옛 게시물은 지움.
     * 옛 게시물을 스크랩한 손님은 새 버전을 스크랩한 것으로 옮김
     */
    @Transactional
    public ShortformDetailResponse replace(Long memberId, Long oldId, Long newId) {
        Shortform old = findMine(memberId, oldId);
        Shortform next = findMine(memberId, newId);
        if (old.getId().equals(next.getId()) || !old.getStore().getId().equals(next.getStore().getId())) {
            throw new BusinessException(ErrorCode.SHORTFORM_REPLACE_INVALID);
        }
        for (ShortformScrap scrap : shortformScrapRepository.findAllByShortform(old)) {
            if (!shortformScrapRepository.existsByMemberAndShortform(scrap.getMember(), next)) {
                shortformScrapRepository.save(ShortformScrap.builder().member(scrap.getMember()).shortform(next).build());
            }
        }
        next.publish();
        remove(old);
        return ShortformDetailResponse.from(next);
    }

    private void remove(Shortform shortform) {
        shortformScrapRepository.deleteAllByShortform(shortform);
        generationRepository.findAllByShortform(shortform).forEach(Generation::detachShortform);
        shortformRepository.delete(shortform);
    }

    private Shortform findMine(Long memberId, Long shortformId) {
        Shortform shortform = shortformRepository.findById(shortformId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHORTFORM_NOT_FOUND));
        if (!shortform.isOwnedBy(memberId)) {
            throw new BusinessException(ErrorCode.SHORTFORM_FORBIDDEN);
        }
        return shortform;
    }
}
