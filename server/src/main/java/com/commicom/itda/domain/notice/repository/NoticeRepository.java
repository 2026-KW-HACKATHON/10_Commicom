package com.commicom.itda.domain.notice.repository;

import com.commicom.itda.domain.notice.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    /** 고정 공지 먼저, 그다음 최신 순 */
    List<Notice> findAllByOrderByPinnedDescIdDesc();
}
