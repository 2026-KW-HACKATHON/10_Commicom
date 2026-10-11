-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-12: 쿠폰 교환권(쿠폰 풀이 비었을 때 레벨업 쿠폰 대신) + 초기 사장님 이벤트

-- 1. 교환권 기한이 지나 바뀐 먹이 기록
ALTER TABLE feed_log MODIFY source ENUM ('AD','DAILY','QUEST','VOUCHER') NOT NULL;

-- 2. 레벨업 보상에 교환권 추가
ALTER TABLE pigeon_level_history MODIFY reward_type ENUM ('COUPON','FEED','VOUCHER') NOT NULL;
ALTER TABLE pigeon_level_history ADD COLUMN voucher_id BIGINT NULL;

-- 3. 쿠폰 교환권 (3주 안에 쿠폰으로 바꾸거나, 지나면 먹이 4개)
CREATE TABLE coupon_voucher (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    member_id      BIGINT      NOT NULL,
    status         ENUM ('EXCHANGED','EXPIRED','ISSUED') NOT NULL,
    expires_at     DATETIME(6) NOT NULL,
    user_coupon_id BIGINT,
    created_at     DATETIME(6),
    updated_at     DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_coupon_voucher_member (member_id)
);

-- 4. 초기 사장님 이벤트 당첨 가게 (선착순 10곳, 가게당 1번)
CREATE TABLE early_owner_reward (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    store_id   BIGINT      NOT NULL,
    coupon_id  BIGINT      NOT NULL,
    granted_at DATETIME(6) NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_early_owner_reward_store (store_id)
);
