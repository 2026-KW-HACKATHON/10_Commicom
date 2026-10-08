package com.commicom.itda.domain.pigeon.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.concurrent.ThreadLocalRandom;

/** 비둘기 종류 — 알이 부화할 때 랜덤으로 정해진다 (Figma 음식 비둘기) */
@Getter
@RequiredArgsConstructor
public enum PigeonBreed {

    KOREAN("한식"),
    JAPANESE("일식"),
    CHINESE("중식"),
    WESTERN("양식"),
    MART("마트"),
    CAFE("카페");

    private final String description;

    public static PigeonBreed random() {
        PigeonBreed[] all = values();
        return all[ThreadLocalRandom.current().nextInt(all.length)];
    }
}
