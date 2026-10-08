-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-09: 게시물 공개 여부 (AI 생성 직후엔 비공개 → 사장님이 [업로드]하면 공개)
-- 이미 있는 게시물은 공개 상태로 둠

ALTER TABLE shortform ADD COLUMN published BIT NOT NULL DEFAULT 1;
