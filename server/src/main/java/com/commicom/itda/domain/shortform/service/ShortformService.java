package com.commicom.itda.domain.shortform.service;

import com.commicom.itda.domain.pro.repository.ProSubscriptionRepository;
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

    public ShortformFeedResponse getFeed(Long storeId, int page, int size) {
        LocalDateTime now = KstTime.now();
        Page<Shortform> shortformPage;
        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            shortformPage = shortformRepository.findAllByStore(store, pageable);
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
}
