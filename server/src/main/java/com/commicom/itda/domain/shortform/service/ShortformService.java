package com.commicom.itda.domain.shortform.service;

import com.commicom.itda.domain.shortform.dto.ShortformDetailResponse;
import com.commicom.itda.domain.shortform.dto.ShortformFeedResponse;
import com.commicom.itda.domain.shortform.dto.ShortformSummaryResponse;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShortformService {

    private final ShortformRepository shortformRepository;
    private final StoreRepository storeRepository;

    public ShortformFeedResponse getFeed(Long storeId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Shortform> shortformPage;
        if (storeId != null) {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
            shortformPage = shortformRepository.findAllByStore(store, pageable);
        } else {
            shortformPage = shortformRepository.findAll(pageable);
        }

        List<ShortformSummaryResponse> shortforms = shortformPage.getContent()
                .stream().map(ShortformSummaryResponse::from).toList();

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
