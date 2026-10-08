-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-09: 게시물 한 개에 사진 여러 장 (AI 사진 1장 + 사장님 사진 최대 4장)
-- 게시물 테이블(shortform)의 AI 이미지 전환(image_url) SQL 을 먼저 반영한 뒤 실행

CREATE TABLE shortform_photo (
    shortform_id BIGINT        NOT NULL,
    sort_order   INT           NOT NULL,
    url          VARCHAR(1000) NOT NULL,
    PRIMARY KEY (shortform_id, sort_order),
    CONSTRAINT fk_shortform_photo_shortform FOREIGN KEY (shortform_id) REFERENCES shortform (id)
);
