package com.commicom.itda.domain.coupon.service;

import com.commicom.itda.domain.coupon.dto.CouponDtos.AvailableCoupon;
import com.commicom.itda.domain.coupon.dto.CouponDtos.AvailableCouponList;
import com.commicom.itda.domain.coupon.dto.CouponDtos.CreateRequest;
import com.commicom.itda.domain.coupon.dto.CouponDtos.CreateResponse;
import com.commicom.itda.domain.coupon.dto.CouponDtos.DownloadResponse;
import com.commicom.itda.domain.coupon.dto.CouponDtos.MyCoupon;
import com.commicom.itda.domain.coupon.dto.CouponDtos.MyCouponPage;
import com.commicom.itda.domain.coupon.dto.CouponDtos.OwnerCoupon;
import com.commicom.itda.domain.coupon.dto.CouponDtos.OwnerCouponList;
import com.commicom.itda.domain.coupon.dto.CouponDtos.RedeemResponse;
import com.commicom.itda.domain.coupon.dto.CouponDtos.Settlement;
import com.commicom.itda.domain.coupon.dto.CouponDtos.SettlementItem;
import com.commicom.itda.domain.coupon.dto.CouponDtos.StatusResponse;
import com.commicom.itda.domain.coupon.entity.Coupon;
import com.commicom.itda.domain.coupon.entity.CouponRedemption;
import com.commicom.itda.domain.coupon.entity.CouponStatus;
import com.commicom.itda.domain.coupon.entity.DiscountType;
import com.commicom.itda.domain.coupon.entity.UserCoupon;
import com.commicom.itda.domain.coupon.entity.UserCouponSource;
import com.commicom.itda.domain.coupon.entity.UserCouponStatus;
import com.commicom.itda.domain.coupon.repository.CouponRedemptionRepository;
import com.commicom.itda.domain.coupon.repository.CouponRepository;
import com.commicom.itda.domain.coupon.repository.UserCouponRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 쿠폰: 사장님 발행·중지·사용 처리·정산 / 손님 받기·내 쿠폰함 / 비둘기 레벨업 보상 지급.
 * 할인은 사장님 부담이고, 손님이 쓰면 건당 수수료(COUPON_FEE)를 정산에 남긴다
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponService {

    /** 쿠폰 1건 사용 수수료 (원) */
    public static final int COUPON_FEE = 100;
    public static final int AMOUNT_MIN = 100;
    public static final int RATE_MIN = 10;
    public static final int RATE_MAX = 80;
    public static final int PAGE_MAX_SIZE = 50;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final CouponRedemptionRepository redemptionRepository;
    private final StoreRepository storeRepository;

    /* ── 사장님 ── */

    @Transactional
    public CreateResponse create(Long memberId, Long storeId, CreateRequest request) {
        findMyStore(memberId, storeId);
        int value = request.discountValue();
        if (request.discountType() == DiscountType.AMOUNT && value < AMOUNT_MIN) {
            throw new BusinessException(ErrorCode.COUPON_AMOUNT_TOO_SMALL);
        }
        if (request.discountType() == DiscountType.RATE && (value < RATE_MIN || value > RATE_MAX)) {
            throw new BusinessException(ErrorCode.COUPON_RATE_OUT_OF_RANGE);
        }
        Coupon coupon = couponRepository.save(Coupon.builder()
                .storeId(storeId)
                .title(request.title().strip())
                .discountType(request.discountType())
                .discountValue(value)
                .minOrderAmount(request.minOrderAmount() == null ? 0 : request.minOrderAmount())
                .totalQuantity(request.totalQuantity())
                .validDays(request.validDays())
                .useAsPigeonReward(Boolean.TRUE.equals(request.useAsPigeonReward()))
                .build());
        return new CreateResponse(coupon.getId(), coupon.getStatus(), KstTime.offset(KstTime.now()));
    }

    public OwnerCouponList ownerList(Long memberId, Long storeId, CouponStatus status) {
        findMyStore(memberId, storeId);
        List<Coupon> coupons = status == null
                ? couponRepository.findAllByStoreIdOrderByIdDesc(storeId)
                : couponRepository.findAllByStoreIdAndStatusOrderByIdDesc(storeId, status);
        return new OwnerCouponList(coupons.stream()
                .map(c -> new OwnerCoupon(c.getId(), c.getTitle(), c.getDiscountType(), c.getDiscountValue(),
                        c.getMinOrderAmount(), c.getTotalQuantity(), c.getIssuedCount(), c.getUsedCount(),
                        c.remainingQuantity(), c.isUseAsPigeonReward(), c.getStatus(), KstTime.fromServerTime(c.getCreatedAt())))
                .toList());
    }

    /** 발행 중지 (이미 받은 쿠폰은 기한까지 쓸 수 있음) */
    @Transactional
    public StatusResponse stop(Long memberId, Long storeId, Long couponId) {
        findMyStore(memberId, storeId);
        Coupon coupon = couponRepository.findById(couponId)
                .filter(c -> c.getStoreId().equals(storeId))
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));
        if (coupon.getStatus() != CouponStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.COUPON_NOT_ACTIVE);
        }
        coupon.stop();
        return new StatusResponse(coupon.getId(), coupon.getStatus());
    }

    /** 손님이 보여 준 코드로 사용 처리 — 내 가게 쿠폰만 */
    @Transactional
    public RedeemResponse redeem(Long memberId, String redeemCode) {
        Store store = storeRepository.findByOwnerId(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_MY_NOT_FOUND));
        UserCoupon uc = userCouponRepository.findByRedeemCodeForUpdate(redeemCode.strip().toUpperCase())
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_CODE_NOT_FOUND));
        Coupon coupon = couponRepository.findById(uc.getCouponId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));
        if (!coupon.getStoreId().equals(store.getId())) {
            throw new BusinessException(ErrorCode.COUPON_OTHER_STORE);
        }
        LocalDateTime now = KstTime.now();
        UserCouponStatus status = uc.effectiveStatus(now);
        if (status == UserCouponStatus.USED) {
            throw new BusinessException(ErrorCode.COUPON_ALREADY_USED);
        }
        if (status == UserCouponStatus.EXPIRED) {
            throw new BusinessException(ErrorCode.COUPON_EXPIRED);
        }
        uc.use(now);
        coupon.useOne();
        redemptionRepository.save(new CouponRedemption(store.getId(), uc.getId(), coupon.getTitle(),
                coupon.getDiscountValue(), COUPON_FEE, now));
        return new RedeemResponse(uc.getId(), coupon.getTitle(), coupon.getDiscountType(), coupon.getDiscountValue(),
                coupon.getMinOrderAmount(), COUPON_FEE, KstTime.offset(now));
    }

    /** 월별 정산 (month: YYYY-MM, KST) */
    public Settlement settlement(Long memberId, Long storeId, String month) {
        findMyStore(memberId, storeId);
        YearMonth ym;
        try {
            ym = YearMonth.parse(month);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        List<CouponRedemption> rows = redemptionRepository
                .findAllByStoreIdAndRedeemedAtGreaterThanEqualAndRedeemedAtLessThanOrderByRedeemedAtDesc(
                        storeId, ym.atDay(1).atStartOfDay(), ym.plusMonths(1).atDay(1).atStartOfDay());
        return new Settlement(ym.toString(), rows.size(),
                rows.stream().mapToLong(CouponRedemption::getDiscountValue).sum(),
                rows.stream().mapToLong(CouponRedemption::getFee).sum(),
                rows.stream()
                        .map(r -> new SettlementItem(r.getUserCouponId(), r.getTitle(), r.getDiscountValue(), r.getFee(), KstTime.offset(r.getRedeemedAt())))
                        .toList());
    }

    /* ── 손님 ── */

    /** 가게에서 지금 받을 수 있는 쿠폰 (로그인 전이면 alreadyDownloaded 는 모두 false) */
    public AvailableCouponList available(Long memberId, Long storeId) {
        findStore(storeId);
        Set<Long> mine = memberId == null ? Set.of() : userCouponRepository.findAllByMemberId(memberId).stream()
                .map(UserCoupon::getCouponId)
                .collect(Collectors.toSet());
        return new AvailableCouponList(couponRepository.findAllByStoreIdAndStatusOrderByIdDesc(storeId, CouponStatus.ACTIVE).stream()
                .filter(Coupon::isIssuable)
                .map(c -> new AvailableCoupon(c.getId(), c.getTitle(), c.getDiscountType(), c.getDiscountValue(),
                        c.getMinOrderAmount(), c.getValidDays(), c.remainingQuantity(), mine.contains(c.getId())))
                .toList());
    }

    /** 쿠폰 받기 (같은 쿠폰은 한 번만) */
    @Transactional
    public DownloadResponse download(Long memberId, Long couponId) {
        Coupon coupon = couponRepository.findByIdForUpdate(couponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));
        if (userCouponRepository.existsByMemberIdAndCouponId(memberId, couponId)) {
            throw new BusinessException(ErrorCode.COUPON_ALREADY_DOWNLOADED);
        }
        if (!coupon.isIssuable()) {
            throw new BusinessException(ErrorCode.COUPON_SOLD_OUT);
        }
        UserCoupon uc = issue(memberId, coupon, UserCouponSource.DOWNLOAD);
        return new DownloadResponse(uc.getId(), uc.getRedeemCode(), KstTime.offset(uc.getExpiresAt()));
    }

    /** 내 쿠폰함: 쓸 수 있는 쿠폰은 기한 임박 순, 나머지는 최근 받은 순 */
    public MyCouponPage mine(Long memberId, UserCouponStatus status, int page, int size) {
        if (page < 0 || size < 1 || size > PAGE_MAX_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        LocalDateTime now = KstTime.now();
        List<UserCoupon> owned = userCouponRepository.findAllByMemberId(memberId);
        Map<Long, Coupon> coupons = couponRepository.findAllById(owned.stream().map(UserCoupon::getCouponId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Coupon::getId, Function.identity()));
        Map<Long, String> storeNames = storeNames(coupons.values().stream().map(Coupon::getStoreId).toList());

        List<MyCoupon> all = owned.stream()
                .filter(uc -> coupons.containsKey(uc.getCouponId()))
                .filter(uc -> status == null || uc.effectiveStatus(now) == status)
                .sorted(myCouponOrder(now))
                .map(uc -> {
                    Coupon c = coupons.get(uc.getCouponId());
                    return new MyCoupon(uc.getId(), c.getStoreId(), storeNames.getOrDefault(c.getStoreId(), "가게"),
                            c.getTitle(), c.getDiscountType(), c.getDiscountValue(), c.getMinOrderAmount(), uc.getSource(),
                            uc.getRedeemCode(), uc.effectiveStatus(now), KstTime.offset(uc.getExpiresAt()), KstTime.offset(uc.getUsedAt()));
                })
                .toList();
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        return new MyCouponPage(all.subList(from, to), page, size, to < all.size());
    }

    /* ── 다른 도메인에서 ── */

    /** 가게별 지금 받을 수 있는 쿠폰 수 (지도 availableCouponCount) */
    public Map<Long, Integer> issuableCountByStore() {
        return couponRepository.countIssuableByStore().stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> ((Number) r[1]).intValue()));
    }

    /**
     * 비둘기 레벨업 보상: 사장님들이 비둘기 보상으로 내놓은 쿠폰 중 1장 (아직 안 가진 쿠폰을 먼저).
     * 풀이 비었으면 empty
     */
    @Transactional
    public Optional<UserCoupon> issuePigeonReward(Long memberId) {
        List<Coupon> pool = couponRepository.findAllByStatusAndUseAsPigeonRewardTrue(CouponStatus.ACTIVE).stream()
                .filter(Coupon::isIssuable)
                .toList();
        if (pool.isEmpty()) {
            return Optional.empty();
        }
        Set<Long> mine = userCouponRepository.findAllByMemberId(memberId).stream()
                .map(UserCoupon::getCouponId).collect(Collectors.toSet());
        List<Coupon> fresh = pool.stream().filter(c -> !mine.contains(c.getId())).toList();
        List<Coupon> candidates = fresh.isEmpty() ? pool : fresh;
        Coupon picked = couponRepository.findByIdForUpdate(candidates.get(ThreadLocalRandom.current().nextInt(candidates.size())).getId())
                .filter(Coupon::isIssuable)
                .orElse(null);
        return picked == null ? Optional.empty() : Optional.of(issue(memberId, picked, UserCouponSource.PIGEON_REWARD));
    }

    public List<UserCoupon> findUserCoupons(Collection<Long> ids) {
        return ids.isEmpty() ? List.of() : userCouponRepository.findAllByIdIn(ids);
    }

    public Map<Long, Coupon> findCoupons(Collection<Long> ids) {
        return couponRepository.findAllById(ids).stream().collect(Collectors.toMap(Coupon::getId, Function.identity()));
    }

    public Map<Long, String> storeNames(Collection<Long> storeIds) {
        return storeRepository.findAllById(new HashSet<>(storeIds)).stream()
                .collect(Collectors.toMap(Store::getId, Store::getName));
    }

    /** 회원 탈퇴: 받은 쿠폰 삭제 (정산 기록은 남김) */
    @Transactional
    public void deleteAllOf(Long memberId) {
        userCouponRepository.deleteByMemberId(memberId);
    }

    private UserCoupon issue(Long memberId, Coupon coupon, UserCouponSource source) {
        coupon.issueOne();
        LocalDateTime expiresAt = KstTime.endOfDay(KstTime.today().plusDays(coupon.getValidDays()));
        return userCouponRepository.save(new UserCoupon(memberId, coupon.getId(), source, newRedeemCode(), expiresAt));
    }

    private String newRedeemCode() {
        for (;;) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!userCouponRepository.existsByRedeemCode(code)) {
                return code;
            }
        }
    }

    private static Comparator<UserCoupon> myCouponOrder(LocalDateTime now) {
        return (a, b) -> {
            boolean aOk = a.effectiveStatus(now) == UserCouponStatus.AVAILABLE;
            boolean bOk = b.effectiveStatus(now) == UserCouponStatus.AVAILABLE;
            if (aOk && bOk) {
                return a.getExpiresAt().compareTo(b.getExpiresAt());
            }
            if (aOk != bOk) {
                return aOk ? -1 : 1;
            }
            return b.getId().compareTo(a.getId());
        };
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
}
