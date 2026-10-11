package com.commicom.itda.domain.pigeon.dto;

import com.commicom.itda.domain.pigeon.entity.CouponVoucher;
import com.commicom.itda.domain.pigeon.entity.Pigeon;
import com.commicom.itda.domain.pigeon.entity.PigeonBreed;
import com.commicom.itda.domain.pigeon.entity.PigeonGraduation;
import com.commicom.itda.domain.pigeon.entity.PigeonLevel;
import com.commicom.itda.domain.pigeon.entity.PigeonLevelHistory;
import com.commicom.itda.global.util.KstTime;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** 비둘기 API 요청·응답 */
public final class PigeonDtos {

    private PigeonDtos() {
    }

    /** GET /api/pigeon */
    public record PigeonResponse(
            /** 0 = 알 */
            int level,
            int maxLevel,
            String levelName,
            int currentFeed,
            Integer requiredFeed,
            boolean isEgg,
            boolean isMaxLevel,
            int feedBalance,
            /** 비둘기 종류 (알이면 null): KOREAN / JAPANESE / CHINESE / WESTERN / MART / CAFE */
            PigeonBreed breed,
            String breedName,
            /** 몇 번째 비둘기인지 (졸업할 때마다 +1) */
            int generation,
            OffsetDateTime startedAt,
            Today today
    ) {
        public record Today(boolean dailyFeedClaimed, int adFeedCount, int adFeedLimit) {
        }

        public static PigeonResponse of(Pigeon p, Today today) {
            return new PigeonResponse(p.getLevel(), PigeonLevel.MAX_LEVEL, null, p.getCurrentFeed(),
                    PigeonLevel.requiredFeed(p.getLevel()), p.isEgg(), p.isMaxLevel(), p.getFeedBalance(),
                    p.getBreed(), p.getBreed() == null ? null : p.getBreed().getDescription(),
                    p.getGeneration(), KstTime.offset(p.getStartedAt()), today);
        }
    }

    /** 알에서 깨어난 비둘기 */
    public record Hatched(PigeonBreed breed, String breedName) {
        public static Hatched of(PigeonBreed breed) {
            return new Hatched(breed, breed.getDescription());
        }
    }

    /** 먹이를 주고받는 응답에 공통으로 들어가는 비둘기 상태 변화 */
    public record PigeonChange(int levelBefore, int levelAfter, int currentFeed, Integer requiredFeed, String levelName) {
        public static PigeonChange of(int levelBefore, Pigeon p) {
            return new PigeonChange(levelBefore, p.getLevel(), p.getCurrentFeed(), PigeonLevel.requiredFeed(p.getLevel()), null);
        }
    }

    /** 쿠폰 보상 (먹이 보상이면 null) */
    public record RewardCoupon(Long userCouponId, String storeName, String title, OffsetDateTime expiresAt) {
    }

    /** 쿠폰 교환권 (status ISSUED: 바꿀 수 있음 / EXCHANGED: 쿠폰으로 바꿈 / EXPIRED: 기한이 지나 먹이로 바뀜) */
    public record RewardVoucher(Long voucherId, String status, OffsetDateTime expiresAt, RewardCoupon userCoupon) {
        public static RewardVoucher of(CouponVoucher v, RewardCoupon coupon) {
            return new RewardVoucher(v.getId(), v.getStatus().name(), KstTime.offset(v.getExpiresAt()), coupon);
        }
    }

    /** type FEED·COUPON·VOUCHER — VOUCHER 면 voucher 에 교환권 */
    public record Reward(String type, int feedAmount, RewardCoupon userCoupon, RewardVoucher voucher) {
    }

    public record LevelUp(int fromLevel, int toLevel, Reward reward) {
        public static LevelUp of(PigeonLevelHistory h, RewardCoupon coupon, RewardVoucher voucher) {
            return new LevelUp(h.getFromLevel(), h.getToLevel(), new Reward(h.getRewardType().name(), h.getFeedAmount(), coupon, voucher));
        }
    }

    /**
     * GET /api/pigeon/vouchers — 내 교환권 (기한 지난 건 이때 먹이로 바뀜).
     * poolAvailable: 지금 바꿀 쿠폰이 있는지, validDays·expiryFeed: 안내 문구용
     */
    public record VoucherList(List<RewardVoucher> vouchers, boolean poolAvailable, int validDays, int expiryFeed) {
    }

    /** POST /api/pigeon/vouchers/{id}/exchange — 바꾼 쿠폰 (기한이 이미 지났으면 feedGained 만큼 먹이로 바뀜) */
    public record VoucherExchangeResult(RewardVoucher voucher, int feedGained, int feedBalance) {
    }

    /** POST /api/pigeon/feeds/daily, /feeds/ad — 먹이는 보유 먹이에 쌓이고 레벨업은 없음 */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record FeedResult(
            int feedGained,
            Integer adFeedCount,
            Integer adFeedLimit,
            PigeonChange pigeon,
            List<LevelUp> levelUps,
            int feedBalance
    ) {
    }

    /** POST /api/pigeon/feed — 보유 먹이를 먹이고 레벨업·뽑기. 알이 깨어났으면 hatched (아니면 null) */
    public record FeedPigeonResult(int fed, PigeonChange pigeon, Hatched hatched, List<LevelUp> levelUps, int feedBalance) {
    }

    public record HistoryItem(Long historyId, int generation, int fromLevel, int toLevel, Reward reward, OffsetDateTime createdAt) {
    }

    /** 내 비둘기 앨범의 졸업한 비둘기 */
    public record AlbumItem(
            int generation,
            PigeonBreed breed,
            String breedName,
            OffsetDateTime startedAt,
            OffsetDateTime graduatedAt,
            /** 알을 받은 날부터 졸업까지 (일) */
            long days,
            int rewardCouponCount
    ) {
        public static AlbumItem from(PigeonGraduation g) {
            return new AlbumItem(g.getGeneration(), g.getBreed(), g.getBreed().getDescription(),
                    KstTime.offset(g.getStartedAt()), KstTime.offset(g.getGraduatedAt()),
                    ChronoUnit.DAYS.between(g.getStartedAt().toLocalDate(), g.getGraduatedAt().toLocalDate()) + 1,
                    g.getRewardCouponCount());
        }
    }

    /** GET /api/pigeon/album — 최근 졸업 순 */
    public record Album(List<AlbumItem> graduates) {
    }

    /** POST /api/pigeon/graduate — 졸업한 비둘기 + 새로 받은 알 */
    public record GraduateResult(AlbumItem graduated, PigeonResponse pigeon) {
    }

    public record HistoryPage(List<HistoryItem> history, int page, int size, boolean hasNext) {
    }

    public record AdFeedRequest(
            @NotBlank(message = "광고 시청 정보가 없어요")
            @Size(max = 100)
            String adTransactionId
    ) {
    }

    public record FeedRequest(
            @NotNull(message = "먹일 개수를 입력해 주세요")
            @Min(value = 1, message = "1개 이상 먹여 주세요")
            Integer amount
    ) {
    }
}
