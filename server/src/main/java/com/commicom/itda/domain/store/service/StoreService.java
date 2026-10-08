package com.commicom.itda.domain.store.service;

import com.commicom.itda.domain.coupon.service.CouponService;
import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.store.dto.StoreCreateRequest;
import com.commicom.itda.domain.store.dto.StoreDetailResponse;
import com.commicom.itda.domain.store.dto.StoreListResponse;
import com.commicom.itda.domain.store.dto.StoreSummaryResponse;
import com.commicom.itda.domain.store.dto.StoreUpdateRequest;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.domain.quest.repository.QuestSubscriptionRepository;
import com.commicom.itda.global.util.KstTime;
import com.commicom.itda.infra.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreService {

    private final StoreRepository storeRepository;
    private final MemberRepository memberRepository;
    private final StorageService storageService;
    private final QuestSubscriptionRepository questSubscriptionRepository;
    private final CouponService couponService;

    public StoreListResponse getStores(StoreCategory category) {
        List<Store> stores = (category == null)
                ? storeRepository.findAll()
                : storeRepository.findAllByCategory(category);
        Set<Long> questStoreIds = new HashSet<>(questSubscriptionRepository.findActiveStoreIds(KstTime.now()));
        Map<Long, Integer> couponCounts = couponService.issuableCountByStore();
        return StoreListResponse.from(stores.stream()
                .map(s -> StoreSummaryResponse.from(s, questStoreIds.contains(s.getId()), couponCounts.getOrDefault(s.getId(), 0)))
                .toList());
    }

    public StoreDetailResponse getStore(Long storeId) {
        return StoreDetailResponse.from(findStore(storeId));
    }

    public StoreDetailResponse getMyStore(Long memberId) {
        Store store = storeRepository.findByOwnerId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_MY_NOT_FOUND));
        return StoreDetailResponse.from(store);
    }

    /** 사장님 가게 등록 (사장님 1명당 1곳) */
    @Transactional
    public StoreDetailResponse createStore(Long memberId, StoreCreateRequest request, MultipartFile image) {
        Member owner = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (owner.getRole() != Role.OWNER) {
            throw new BusinessException(ErrorCode.STORE_OWNER_ONLY);
        }
        if (storeRepository.existsByOwnerId(memberId)) {
            throw new BusinessException(ErrorCode.STORE_ALREADY_REGISTERED);
        }
        Store store = storeRepository.save(Store.builder()
                .name(request.name().strip())
                .category(request.category())
                .address(request.address().strip())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .thumbnailUrl(hasFile(image) ? storageService.upload(image, "stores") : null)
                .owner(owner)
                .build());
        return StoreDetailResponse.from(store);
    }

    /** 사장님 가게 정보 수정. 사장님은 가게 이름이 곧 닉네임이라 이름을 바꾸면 닉네임도 같이 바꾼다 */
    @Transactional
    public StoreDetailResponse updateStore(Long memberId, Long storeId, StoreUpdateRequest request) {
        Store store = findMyStore(memberId, storeId);
        String name = request.name() == null ? null : request.name().strip();
        if (name != null && !name.equals(store.getName())) {
            if (memberRepository.existsByNicknameAndIdNot(name, memberId)) {
                throw new BusinessException(ErrorCode.MEMBER_NICKNAME_DUPLICATED);
            }
            store.getOwner().updateNickname(name);
        }
        store.update(name, request.category(),
                request.address() == null ? null : request.address().strip(),
                request.latitude(), request.longitude());
        return StoreDetailResponse.from(store);
    }

    @Transactional
    public StoreDetailResponse updateStoreImage(Long memberId, Long storeId, MultipartFile image) {
        Store store = findMyStore(memberId, storeId);
        if (!hasFile(image)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        store.updateThumbnailUrl(storageService.upload(image, "stores"));
        return StoreDetailResponse.from(store);
    }

    private Store findStore(Long storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
    }

    private Store findMyStore(Long memberId, Long storeId) {
        Store store = findStore(storeId);
        if (!store.isOwnedBy(memberId)) {
            throw new BusinessException(ErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }

    private static boolean hasFile(MultipartFile file) {
        return file != null && !file.isEmpty();
    }
}
