package com.commicom.itda.domain.pigeon.service;

import com.commicom.itda.domain.pigeon.dto.PigeonDtos.Album;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.AlbumItem;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.FeedPigeonResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.GraduateResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.Hatched;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.FeedResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.HistoryItem;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.HistoryPage;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.LevelUp;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.PigeonChange;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.PigeonResponse;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.RewardCoupon;
import com.commicom.itda.domain.pigeon.entity.FeedLog;
import com.commicom.itda.domain.pigeon.entity.FeedSource;
import com.commicom.itda.domain.pigeon.entity.Pigeon;
import com.commicom.itda.domain.pigeon.entity.PigeonBreed;
import com.commicom.itda.domain.pigeon.entity.PigeonGraduation;
import com.commicom.itda.domain.pigeon.entity.PigeonLevel;
import com.commicom.itda.domain.pigeon.entity.PigeonLevelHistory;
import com.commicom.itda.domain.pigeon.entity.PigeonLevelHistory.RewardType;
import com.commicom.itda.domain.pigeon.repository.FeedLogRepository;
import com.commicom.itda.domain.pigeon.repository.PigeonGraduationRepository;
import com.commicom.itda.domain.pigeon.repository.PigeonLevelHistoryRepository;
import com.commicom.itda.domain.pigeon.repository.PigeonRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.util.KstTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 비둘기 1마리 키우기.
 * 먹이(무료·광고·퀘스트)는 보유 먹이(feedBalance)에 쌓이기만 하고, [먹이 주기]를 눌러야 레벨업·뽑기가 일어난다.
 * 알(Lv.0) → 먹이 1개로 부화(종류 랜덤) → Lv.10 → 졸업(앨범) → 새 알
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PigeonService {

    public static final int AD_FEED_LIMIT = 3;
    public static final int HISTORY_MAX_SIZE = 50;

    private final PigeonRepository pigeonRepository;
    private final FeedLogRepository feedLogRepository;
    private final PigeonLevelHistoryRepository historyRepository;
    private final PigeonGraduationRepository graduationRepository;
    private final PigeonRewardCouponIssuer rewardCouponIssuer;

    @Transactional
    public PigeonResponse getPigeon(Long memberId) {
        Pigeon pigeon = pigeonOf(memberId);
        LocalDate today = KstTime.today();
        return PigeonResponse.of(pigeon, new PigeonResponse.Today(
                feedLogRepository.existsByMemberIdAndSourceAndFeedDate(memberId, FeedSource.DAILY, today),
                feedLogRepository.countByMemberIdAndSourceAndFeedDate(memberId, FeedSource.AD, today),
                AD_FEED_LIMIT));
    }

    /** 하루 1번 무료 먹이 1개 */
    @Transactional
    public FeedResult claimDaily(Long memberId) {
        Pigeon pigeon = pigeonOf(memberId);
        LocalDate today = KstTime.today();
        if (feedLogRepository.existsByMemberIdAndSourceAndFeedDate(memberId, FeedSource.DAILY, today)) {
            throw new BusinessException(ErrorCode.PIGEON_DAILY_CLAIMED);
        }
        grant(pigeon, 1, FeedSource.DAILY, null);
        return new FeedResult(1, null, null, PigeonChange.of(pigeon.getLevel(), pigeon), List.of(), pigeon.getFeedBalance());
    }

    /** 보상형 광고 1번 = 먹이 1개, 하루 3번까지 */
    @Transactional
    public FeedResult claimAd(Long memberId, String adTransactionId) {
        Pigeon pigeon = pigeonOf(memberId);
        int todayAds = feedLogRepository.countByMemberIdAndSourceAndFeedDate(memberId, FeedSource.AD, KstTime.today());
        if (todayAds >= AD_FEED_LIMIT) {
            throw new BusinessException(ErrorCode.PIGEON_AD_LIMIT);
        }
        if (feedLogRepository.existsByAdTransactionId(adTransactionId)) {
            throw new BusinessException(ErrorCode.PIGEON_AD_DUPLICATED);
        }
        grant(pigeon, 1, FeedSource.AD, adTransactionId);
        return new FeedResult(1, todayAds + 1, AD_FEED_LIMIT, PigeonChange.of(pigeon.getLevel(), pigeon), List.of(), pigeon.getFeedBalance());
    }

    /** 퀘스트 보상 등 다른 도메인에서 먹이를 줄 때 (보유 먹이에 쌓기만 함) */
    @Transactional
    public Pigeon grantQuestFeed(Long memberId, int amount) {
        Pigeon pigeon = pigeonOf(memberId);
        grant(pigeon, amount, FeedSource.QUEST, null);
        return pigeon;
    }

    /**
     * 보유 먹이를 먹이고, 필요 먹이를 채울 때마다 레벨업 + 뽑기 (한 번에 여러 레벨 오를 수 있음).
     * 알(Lv.0)은 먹이 1개로 부화하고 종류가 랜덤으로 정해짐 (부화는 뽑기 없음)
     */
    @Transactional
    public FeedPigeonResult feed(Long memberId, int amount) {
        Pigeon pigeon = pigeonOf(memberId);
        if (pigeon.isMaxLevel()) {
            throw new BusinessException(ErrorCode.PIGEON_MAX_LEVEL);
        }
        if (pigeon.getFeedBalance() < amount) {
            throw new BusinessException(ErrorCode.PIGEON_FEED_SHORTAGE);
        }
        int levelBefore = pigeon.getLevel();
        List<LevelUp> levelUps = new ArrayList<>();
        Hatched hatched = null;
        pigeon.eat(amount);
        while (!pigeon.isMaxLevel() && pigeon.getCurrentFeed() >= PigeonLevel.of(pigeon.getLevel()).getRequiredFeed()) {
            PigeonLevel row = PigeonLevel.of(pigeon.getLevel());
            if (pigeon.isEgg()) {
                PigeonBreed breed = PigeonBreed.random();
                pigeon.hatch(row.getRequiredFeed(), breed);
                hatched = Hatched.of(breed);
                continue;
            }
            pigeon.levelUp(row.getRequiredFeed());
            Drawn drawn = draw(memberId, pigeon.getGeneration(), row, pigeon.getLevel());
            PigeonLevelHistory history = historyRepository.save(drawn.history());
            // 뽑기로 나온 먹이도 바로 먹이지 않고 보유 먹이에 쌓음
            pigeon.addBalance(history.getFeedAmount());
            levelUps.add(LevelUp.of(history, drawn.coupon()));
        }
        return new FeedPigeonResult(amount, PigeonChange.of(levelBefore, pigeon), hatched, levelUps, pigeon.getFeedBalance());
    }

    /** Lv.10 졸업: 앨범에 남기고 새 알을 받음 (보유 먹이는 이어짐) */
    @Transactional
    public GraduateResult graduate(Long memberId) {
        Pigeon pigeon = pigeonOf(memberId);
        if (!pigeon.isMaxLevel()) {
            throw new BusinessException(ErrorCode.PIGEON_NOT_MAX_LEVEL);
        }
        LocalDateTime now = KstTime.now();
        int coupons = historyRepository.countByMemberIdAndGenerationAndRewardType(memberId, pigeon.getGeneration(), RewardType.COUPON);
        PigeonGraduation graduation = graduationRepository.save(new PigeonGraduation(
                memberId, pigeon.getGeneration(), pigeon.getBreed(), pigeon.getStartedAt(), now, coupons));
        pigeon.startNext(now);
        return new GraduateResult(AlbumItem.from(graduation), getPigeon(memberId));
    }

    /** 내 비둘기 앨범 (졸업한 비둘기, 최근 순) */
    public Album getAlbum(Long memberId) {
        return new Album(graduationRepository.findAllByMemberIdOrderByGenerationDesc(memberId).stream()
                .map(AlbumItem::from)
                .toList());
    }

    public HistoryPage getHistory(Long memberId, int page, int size) {
        if (page < 0 || size < 1 || size > HISTORY_MAX_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        Slice<PigeonLevelHistory> slice = historyRepository.findByMemberIdOrderByIdDesc(memberId, PageRequest.of(page, size));
        Map<Long, RewardCoupon> coupons = rewardCouponIssuer.describe(slice.getContent().stream()
                .map(PigeonLevelHistory::getUserCouponId)
                .filter(Objects::nonNull)
                .toList());
        List<HistoryItem> items = slice.getContent().stream()
                .map(h -> {
                    LevelUp l = LevelUp.of(h, h.getUserCouponId() == null ? null : coupons.get(h.getUserCouponId()));
                    return new HistoryItem(h.getId(), h.getGeneration(), l.fromLevel(), l.toLevel(), l.reward(), KstTime.fromServerTime(h.getCreatedAt()));
                })
                .toList();
        return new HistoryPage(items, page, size, slice.hasNext());
    }

    /** 회원 탈퇴 */
    @Transactional
    public void deleteAllOf(Long memberId) {
        historyRepository.deleteByMemberId(memberId);
        graduationRepository.deleteByMemberId(memberId);
        feedLogRepository.deleteByMemberId(memberId);
        pigeonRepository.deleteByMemberId(memberId);
    }

    /** 처음이면 알을 줌 */
    private Pigeon pigeonOf(Long memberId) {
        Pigeon pigeon = pigeonRepository.findByMemberId(memberId)
                .orElseGet(() -> pigeonRepository.save(new Pigeon(memberId, KstTime.now())));
        pigeon.assignBreedIfMissing();
        return pigeon;
    }

    private void grant(Pigeon pigeon, int amount, FeedSource source, String adTransactionId) {
        feedLogRepository.save(new FeedLog(pigeon.getMemberId(), source, amount, KstTime.today(), adTransactionId));
        pigeon.addBalance(amount);
    }

    private record Drawn(PigeonLevelHistory history, RewardCoupon coupon) {
    }

    /** 레벨업 뽑기: 쿠폰 / 먹이 1개 / 먹이 2개 */
    private Drawn draw(Long memberId, int generation, PigeonLevel row, int toLevel) {
        double r = ThreadLocalRandom.current().nextDouble();
        if (r < row.getCouponRate()) {
            RewardCoupon coupon = rewardCouponIssuer.issue(memberId).orElse(null);
            if (coupon != null) {
                return new Drawn(new PigeonLevelHistory(memberId, generation, toLevel - 1, toLevel, RewardType.COUPON, 0, coupon.userCouponId()), coupon);
            }
            // 쿠폰 풀이 비었을 때: 중간 레벨은 먹이 2개로 대체. Lv.10 확정 쿠폰은 미정 → 먹이 0
            return new Drawn(new PigeonLevelHistory(memberId, generation, toLevel - 1, toLevel, RewardType.FEED, toLevel >= PigeonLevel.MAX_LEVEL ? 0 : 2, null), null);
        }
        int feed = r < row.getCouponRate() + row.getFeed1Rate() ? 1 : 2;
        return new Drawn(new PigeonLevelHistory(memberId, generation, toLevel - 1, toLevel, RewardType.FEED, feed, null), null);
    }
}
