-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-09: 가게 사장님 연결 + 퀘스트·비둘기·쿠폰 테이블
-- (퀘스트 기본 데이터는 서버가 켜질 때 QuestSeeder 가 자동으로 채움)

-- 1. 가게 ↔ 사장님 (사장님 1명당 가게 1곳)
ALTER TABLE store ADD COLUMN owner_id BIGINT NULL;
ALTER TABLE store ADD CONSTRAINT uk_store_owner UNIQUE (owner_id);
ALTER TABLE store ADD CONSTRAINT fk_store_owner FOREIGN KEY (owner_id) REFERENCES member (id);

-- 2. 비둘기
CREATE TABLE pigeon (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    member_id    BIGINT NOT NULL,
    level        INT    NOT NULL,
    current_feed INT    NOT NULL,
    feed_balance INT    NOT NULL,
    breed        ENUM ('CAFE','CHINESE','JAPANESE','KOREAN','MART','WESTERN'),
    generation   INT    NOT NULL,
    started_at   DATETIME(6) NOT NULL,
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_pigeon_member (member_id)
);

CREATE TABLE feed_log (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    member_id         BIGINT NOT NULL,
    source            ENUM ('AD','DAILY','QUEST') NOT NULL,
    amount            INT    NOT NULL,
    feed_date         DATE   NOT NULL,
    ad_transaction_id VARCHAR(100),
    created_at        DATETIME(6),
    updated_at        DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_feed_log_ad (ad_transaction_id),
    KEY idx_feed_log_member_date (member_id, feed_date)
);

CREATE TABLE pigeon_level_history (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    member_id      BIGINT NOT NULL,
    generation     INT    NOT NULL,
    from_level     INT    NOT NULL,
    to_level       INT    NOT NULL,
    reward_type    ENUM ('COUPON','FEED') NOT NULL,
    feed_amount    INT    NOT NULL,
    user_coupon_id BIGINT,
    created_at     DATETIME(6),
    updated_at     DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_pigeon_history_member (member_id)
);

CREATE TABLE pigeon_graduation (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    member_id           BIGINT      NOT NULL,
    generation          INT         NOT NULL,
    breed               ENUM ('CAFE','CHINESE','JAPANESE','KOREAN','MART','WESTERN') NOT NULL,
    started_at          DATETIME(6) NOT NULL,
    graduated_at        DATETIME(6) NOT NULL,
    reward_coupon_count INT         NOT NULL,
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_pigeon_graduation_member (member_id)
);

-- 3. 퀘스트
CREATE TABLE quest (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    title        VARCHAR(100) NOT NULL,
    type         ENUM ('BASIC','VISIT') NOT NULL,
    target_count INT          NOT NULL,
    reward_feed  INT          NOT NULL,
    template_key VARCHAR(30),
    basic_event  ENUM ('SHORTFORM_VIEW','STORE_VIEW'),
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_quest_template (template_key)
);

CREATE TABLE quest_subscription (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    store_id   BIGINT      NOT NULL,
    started_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_quest_subscription_store (store_id)
);

CREATE TABLE quest_participation (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    quest_id   BIGINT NOT NULL,
    store_id   BIGINT NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_quest_participation (quest_id, store_id)
);

CREATE TABLE quest_visit (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    member_id  BIGINT NOT NULL,
    quest_id   BIGINT NOT NULL,
    store_id   BIGINT NOT NULL,
    visit_date DATE   NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_quest_visit (member_id, quest_id, store_id),
    KEY idx_quest_visit_member_store_date (member_id, store_id, visit_date)
);

CREATE TABLE quest_event_log (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    member_id  BIGINT NOT NULL,
    quest_id   BIGINT NOT NULL,
    target_id  BIGINT NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_quest_event_log (member_id, quest_id, target_id)
);

CREATE TABLE quest_completion (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    member_id  BIGINT NOT NULL,
    quest_id   BIGINT NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_quest_completion (member_id, quest_id)
);

-- 4. 쿠폰
CREATE TABLE coupon (
    id                   BIGINT      NOT NULL AUTO_INCREMENT,
    store_id             BIGINT      NOT NULL,
    title                VARCHAR(30) NOT NULL,
    discount_type        ENUM ('AMOUNT','RATE') NOT NULL,
    discount_value       INT         NOT NULL,
    min_order_amount     INT         NOT NULL,
    total_quantity       INT         NOT NULL,
    issued_count         INT         NOT NULL,
    used_count           INT         NOT NULL,
    valid_days           INT         NOT NULL,
    use_as_pigeon_reward BIT         NOT NULL,
    status               ENUM ('ACTIVE','SOLD_OUT','STOPPED') NOT NULL,
    created_at           DATETIME(6),
    updated_at           DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_coupon_store (store_id)
);

CREATE TABLE user_coupon (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    member_id   BIGINT      NOT NULL,
    coupon_id   BIGINT      NOT NULL,
    source      ENUM ('DOWNLOAD','PIGEON_REWARD','QUEST_REWARD') NOT NULL,
    redeem_code VARCHAR(10) NOT NULL,
    status      ENUM ('AVAILABLE','EXPIRED','USED') NOT NULL,
    expires_at  DATETIME(6) NOT NULL,
    used_at     DATETIME(6),
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_coupon_code (redeem_code),
    KEY idx_user_coupon_member (member_id)
);

CREATE TABLE coupon_redemption (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    store_id       BIGINT      NOT NULL,
    user_coupon_id BIGINT      NOT NULL,
    title          VARCHAR(30) NOT NULL,
    discount_value INT         NOT NULL,
    fee            INT         NOT NULL,
    redeemed_at    DATETIME(6) NOT NULL,
    created_at     DATETIME(6),
    updated_at     DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_coupon_redemption_user_coupon (user_coupon_id),
    KEY idx_coupon_redemption_store_date (store_id, redeemed_at)
);
