package com.commicom.itda.domain.pigeon.repository;

import com.commicom.itda.domain.pigeon.entity.FeedLog;
import com.commicom.itda.domain.pigeon.entity.FeedSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface FeedLogRepository extends JpaRepository<FeedLog, Long> {

    boolean existsByMemberIdAndSourceAndFeedDate(Long memberId, FeedSource source, LocalDate feedDate);

    int countByMemberIdAndSourceAndFeedDate(Long memberId, FeedSource source, LocalDate feedDate);

    boolean existsByAdTransactionId(String adTransactionId);

    void deleteByMemberId(Long memberId);
}
