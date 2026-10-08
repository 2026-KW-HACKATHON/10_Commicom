package com.commicom.itda.domain.quest.repository;

import com.commicom.itda.domain.quest.entity.QuestSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QuestSubscriptionRepository extends JpaRepository<QuestSubscription, Long> {

    Optional<QuestSubscription> findByStoreId(Long storeId);

    /** 지금 퀘스트 가게인(등록 기간 중인) 가게 id */
    @Query("select s.storeId from QuestSubscription s where s.expiresAt > :now")
    List<Long> findActiveStoreIds(LocalDateTime now);
}
