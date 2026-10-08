package com.commicom.itda.domain.quest.entity;

/** 기본(BASIC) 퀘스트가 세는 행동. 같은 대상(숏폼·가게)은 한 번만 센다 */
public enum QuestEventType {
    /** 숏폼 보기 (targetId = shortformId) */
    SHORTFORM_VIEW,
    /** 지도에서 가게 상세 열어 보기 (targetId = storeId) */
    STORE_VIEW
}
