package com.commicom.itda.domain.event.repository;

import com.commicom.itda.domain.event.entity.EarlyOwnerReward;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EarlyOwnerRewardRepository extends JpaRepository<EarlyOwnerReward, Long> {

    boolean existsByStoreId(Long storeId);
}
