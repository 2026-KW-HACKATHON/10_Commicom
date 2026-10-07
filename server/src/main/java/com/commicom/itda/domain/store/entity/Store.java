package com.commicom.itda.domain.store.entity;

import com.commicom.itda.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    @Builder
    private Store(String name, StoreCategory category, String address, Double latitude, Double longitude,
                  String phone, String businessHours, String description, String thumbnailUrl,
                  boolean stepFree, boolean elevator) {
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
    }
}
