-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-12: 의견 남기기 + 공지사항(관리자 작성) + 관리자 계정

-- 1. 회원 역할 컬럼이 ENUM 인데 'ADMIN' 이 없으면 추가 (배포 스크립트가 형식을 확인한 뒤 실행):
--    ALTER TABLE member MODIFY role ENUM ('ADMIN','OWNER','RESIDENT') NOT NULL;

-- 2. 의견 남기기
CREATE TABLE feedback (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    rating     INT         NOT NULL,
    good       VARCHAR(1000),
    bad        VARCHAR(1000),
    mode       VARCHAR(10),
    beta       BIT         NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
);

-- 3. 공지사항
CREATE TABLE notice (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    title      VARCHAR(100)  NOT NULL,
    body       VARCHAR(5000) NOT NULL,
    pinned     BIT           NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
);

-- 4. 관리자 계정 지정 (가입한 이메일로 바꿔서 실행)
-- UPDATE member SET role = 'ADMIN' WHERE email = '관리자로 쓸 이메일';
