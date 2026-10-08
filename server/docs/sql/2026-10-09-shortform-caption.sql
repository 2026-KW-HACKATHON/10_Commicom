-- 배포 DB(MySQL) 반영용. 운영은 ddl-auto: validate 라 서버 배포 전에 먼저 실행해야 함.
-- 2026-10-09: 게시물 소개 글 (사장님 가게 어필을 AI로 다듬은 문장)

ALTER TABLE shortform ADD COLUMN caption VARCHAR(500) NULL;
