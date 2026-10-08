package com.commicom.itda.domain.store.entity;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StoreCategory category;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 20)
    private String phone;

    /** 자유 형식 운영시간 (예: "매일 10:00-21:00, 일요일 휴무") */
    private String businessHours;

    @Column(length = 1000)
    private String description;

    private String thumbnailUrl;

    /** 접근성: 입구에 턱이 없음 */
    @Column(nullable = false)
    private boolean stepFree;

    /** 접근성: 엘리베이터 있음 */
    @Column(nullable = false)
    private boolean elevator;

    /** 퀘스트 가게 여부 */
    @Column(nullable = false)
    private boolean isQuestStore = false;

    /** 사용 가능한 쿠폰 수 */
    @Column(nullable = false)
    private int availableCouponCount = 0;

    /** 가게 사장님 (사장님 1명당 가게 1곳). 샘플 가게나 탈퇴한 사장님의 가게는 null */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", unique = true)
    private Member owner;

    @Builder
    private Store(String name, StoreCategory category, String address, Double latitude, Double longitude,
                  String phone, String businessHours, String description, String thumbnailUrl,
                  boolean stepFree, boolean elevator, boolean isQuestStore, int availableCouponCount,
                  Member owner) {
        this.owner = owner;
        this.name = name;
        this.category = category;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.phone = phone;
        this.businessHours = businessHours;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.stepFree = stepFree;
        this.elevator = elevator;
        this.isQuestStore = isQuestStore;
        this.availableCouponCount = availableCouponCount;
    }

    public boolean isOwnedBy(Long memberId) {
        return owner != null && owner.getId().equals(memberId);
    }

    /** 사장님 정보 수정: null 인 항목은 그대로 둔다 */
    public void update(String name, StoreCategory category, String address, Double latitude, Double longitude) {
        if (name != null) this.name = name;
        if (category != null) this.category = category;
        if (address != null) this.address = address;
        if (latitude != null) this.latitude = latitude;
        if (longitude != null) this.longitude = longitude;
    }

    public void updateThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    /** 사장님 탈퇴: 가게(숏폼·생성 기록)는 남기고 연결만 끊는다 */
    public void detachOwner() {
        this.owner = null;
    }
}
