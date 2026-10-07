package com.commicom.itda.global.init;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;
import com.commicom.itda.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/** local 프로필(H2) 기동 시 확인용 샘플 계정·가게를 넣는다. 실제 매장 정보가 아님. */
@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalDataInitializer implements ApplicationRunner {

    /** 샘플 계정 공통 비밀번호 (local 전용) */
    private static final String SAMPLE_PASSWORD = "password1234";

    private final StoreRepository storeRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        initMembers();
        initStores();
    }

    private void initMembers() {
        if (memberRepository.count() > 0) {
            return;
        }
        String password = passwordEncoder.encode(SAMPLE_PASSWORD);
        memberRepository.saveAll(List.of(
                Member.builder().email("owner@test.com").password(password).nickname("샘플사장님").role(Role.OWNER).build(),
                Member.builder().email("resident@test.com").password(password).nickname("샘플주민").role(Role.RESIDENT).build()
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
}
