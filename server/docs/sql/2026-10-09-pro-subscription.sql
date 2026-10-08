-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-09: 잇다 PRO 구독 (가게 단위, 30일)

CREATE TABLE pro_subscription (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    store_id   BIGINT      NOT NULL,
    started_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    auto_renew BIT         NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_pro_subscription_store (store_id)
);
