package com.commicom.itda.domain.pro.repository;

import com.commicom.itda.domain.pro.entity.ProSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProSubscriptionRepository extends JpaRepository<ProSubscription, Long> {

    Optional<ProSubscription> findByStoreId(Long storeId);

    /** 지금 PRO 이용 중인 가게 id (숏폼 피드 우선 노출) */
    @Query("select p.storeId from ProSubscription p where p.expiresAt > :now")
    List<Long> findActiveStoreIds(LocalDateTime now);
}
