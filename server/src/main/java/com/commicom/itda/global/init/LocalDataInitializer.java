package com.commicom.itda.global.init;

import com.commicom.itda.domain.coupon.entity.Coupon;
import com.commicom.itda.domain.coupon.entity.DiscountType;
import com.commicom.itda.domain.coupon.entity.UserCoupon;
import com.commicom.itda.domain.coupon.entity.UserCouponSource;
import com.commicom.itda.domain.coupon.repository.CouponRepository;
import com.commicom.itda.domain.coupon.repository.UserCouponRepository;
import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.quest.entity.QuestParticipation;
import com.commicom.itda.domain.quest.entity.QuestSubscription;
import com.commicom.itda.domain.quest.repository.QuestParticipationRepository;
import com.commicom.itda.domain.quest.repository.QuestRepository;
import com.commicom.itda.domain.quest.repository.QuestSubscriptionRepository;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;
import com.commicom.itda.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import com.commicom.itda.global.util.KstTime;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** local 프로필(H2) 기동 시 확인용 샘플 계정·가게를 넣는다. 실제 매장 정보가 아님. */
@Component
@Profile("local")
@Order(1)
@RequiredArgsConstructor
public class LocalDataInitializer implements ApplicationRunner {

    /** 샘플 계정 공통 비밀번호 (local 전용) */
    private static final String SAMPLE_PASSWORD = "password1234";

    private final StoreRepository storeRepository;
    private final MemberRepository memberRepository;
    private final ShortformRepository shortformRepository;
    private final PasswordEncoder passwordEncoder;
    private final QuestSubscriptionRepository subscriptionRepository;
    private final QuestParticipationRepository participationRepository;
    private final QuestRepository questRepository;
    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;

    @Override
    public void run(ApplicationArguments args) {
        initMembers();
        initStores();
        initShortforms();
        initQuestStores();
        initCoupons();
    }

    /**
     * 샘플 쿠폰 (분식·카페는 비둘기 보상 풀에도 내놓음).
     * 샘플 주민이 광운 카페 쿠폰을 1장 가지고 있어서 샘플 사장님이 코드 QK7M2P 로 사용 처리를 해 볼 수 있음
     */
    private void initCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }
        Map<String, Long> ids = storeRepository.findAll().stream()
                .collect(Collectors.toMap(Store::getName, Store::getId));
        Long snack = ids.get("[샘플] 월계 분식");
        Long cafe = ids.get("[샘플] 광운 카페");
        Long bakery = ids.get("[샘플] 골목 베이커리");
        if (snack == null || cafe == null || bakery == null) {
            return;
        }
        couponRepository.save(Coupon.builder().storeId(snack).title("떡볶이 10% 할인").discountType(DiscountType.RATE)
                .discountValue(10).minOrderAmount(0).totalQuantity(30).validDays(7).useAsPigeonReward(true).build());
        Coupon americano = couponRepository.save(Coupon.builder().storeId(cafe).title("아메리카노 1,000원 할인").discountType(DiscountType.AMOUNT)
                .discountValue(1000).minOrderAmount(5000).totalQuantity(100).validDays(7).useAsPigeonReward(true).build());
        couponRepository.save(Coupon.builder().storeId(bakery).title("소금빵 500원 할인").discountType(DiscountType.AMOUNT)
                .discountValue(500).minOrderAmount(0).totalQuantity(20).validDays(14).useAsPigeonReward(false).build());

        memberRepository.findByEmail("resident@test.com").ifPresent(resident -> {
            americano.issueOne();
            userCouponRepository.save(new UserCoupon(resident.getId(), americano.getId(), UserCouponSource.DOWNLOAD,
                    "QK7M2P", KstTime.endOfDay(KstTime.today().plusDays(5))));
            couponRepository.save(americano);
        });
    }

    /**
     * 월계 분식·골목 베이커리는 퀘스트 가게 (분식 골목 투어·동네 밥집 탐방 / 동네 카페 투어 참여).
     * 광운 카페(샘플 사장님 가게)는 사장님 화면에서 직접 등록해 보도록 비워 둠
     */
    private void initQuestStores() {
        if (subscriptionRepository.count() > 0) {
            return;
        }
        Map<String, Long> ids = storeRepository.findAll().stream()
                .collect(Collectors.toMap(Store::getName, Store::getId));
        LocalDate today = KstTime.today();
        Map<String, List<String>> joins = Map.of(
                "[샘플] 월계 분식", List.of("restaurant", "snack"),
                "[샘플] 골목 베이커리", List.of("cafe"));
        joins.forEach((name, keys) -> {
            Long storeId = ids.get(name);
            if (storeId == null) {
                return;
            }
            subscriptionRepository.save(new QuestSubscription(storeId, today.minusDays(3).atStartOfDay(),
                    KstTime.endOfDay(today.plusDays(27))));
            keys.forEach(key -> questRepository.findByTemplateKey(key)
                    .ifPresent(q -> participationRepository.save(new QuestParticipation(q.getId(), storeId))));
        });
    }

    private void initMembers() {
        if (memberRepository.count() > 0) {
            return;
        }
        String password = passwordEncoder.encode(SAMPLE_PASSWORD);
        memberRepository.saveAll(List.of(
                Member.builder().email("owner@test.com").password(password).nickname("샘플사장님").role(Role.OWNER).build(),
                Member.builder().email("resident@test.com").password(password).nickname("샘플주민").role(Role.RESIDENT).build(),
                // 가게를 아직 등록하지 않은 사장님 (가입 직후 상태) — 가게 등록 화면 테스트용, 서버를 켤 때마다 가게 없음으로 돌아감
                Member.builder().email("newowner@test.com").password(password).nickname("새사장님").role(Role.OWNER).build()
        ));
    }

    private void initStores() {
        if (storeRepository.count() > 0) {
            return;
        }
        storeRepository.saveAll(List.of(
                Store.builder()
                        .name("[샘플] 월계 분식").category(StoreCategory.RESTAURANT)
                        .address("서울 노원구 월계동 (샘플 주소)").latitude(37.6195).longitude(127.0600)
                        .phone("02-000-0001").businessHours("매일 11:00-21:00")
                        .description("떡볶이와 김밥이 맛있는 동네 분식집")
                        .stepFree(true).elevator(false)
                        .build(),
                Store.builder()
                        .name("[샘플] 광운 카페").category(StoreCategory.CAFE_BAKERY_PUB)
                        .address("서울 노원구 월계동 (샘플 주소)").latitude(37.6202).longitude(127.0578)
                        .phone("02-000-0002").businessHours("평일 08:00-22:00, 주말 10:00-20:00")
                        .description("학생 할인이 있는 핸드드립 카페")
                        .stepFree(false).elevator(false)
                        // 샘플 사장님(owner@test.com)의 가게
                        .owner(memberRepository.findByEmail("owner@test.com").orElse(null))
                        .build(),
                Store.builder()
                        .name("[샘플] 골목 베이커리").category(StoreCategory.CAFE_BAKERY_PUB)
                        .address("서울 노원구 월계동 (샘플 주소)").latitude(37.6178).longitude(127.0612)
                        .phone("02-000-0003").businessHours("화-일 09:00-20:00, 월요일 휴무")
                        .description("매일 아침 굽는 식빵과 소금빵")
                        .stepFree(true).elevator(true)
                        .build()
        ));
    }

    private void initShortforms() {
        if (shortformRepository.count() > 0) {
            return;
        }
        List<Store> stores = storeRepository.findAll();
        if (stores.isEmpty()) {
            return;
        }
        shortformRepository.saveAll(List.of(
                Shortform.builder()
                        .store(stores.get(0))
                        .videoUrl("https://example.com/sample-video-1.mp4")
                        .thumbnailUrl("https://example.com/sample-thumb-1.jpg")
                        .title("월계 분식 숏폼 소개")
                        .script("안녕하세요! 월계동 대표 분식집입니다. 떡볶이와 김밥이 맛있어요.")
                        .duration(30)
                        .build(),
                Shortform.builder()
                        .store(stores.get(1))
                        .videoUrl("https://example.com/sample-video-2.mp4")
                        .thumbnailUrl("https://example.com/sample-thumb-2.jpg")
                        .title("광운 카페 숏폼 소개")
                        .script("학생 할인 있는 핸드드립 카페! 광운대 앞 아늑한 공간에서 만나요.")
                        .duration(25)
                        .build()
        ));
    }
}
