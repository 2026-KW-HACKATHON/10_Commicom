-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-09: 숏폼 스크랩 (가게 스크랩 scrap 테이블과 별도)

CREATE TABLE shortform_scrap (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    member_id    BIGINT NOT NULL,
    shortform_id BIGINT NOT NULL,
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_shortform_scrap_member_shortform (member_id, shortform_id),
    CONSTRAINT fk_shortform_scrap_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_shortform_scrap_shortform FOREIGN KEY (shortform_id) REFERENCES shortform (id)
);
