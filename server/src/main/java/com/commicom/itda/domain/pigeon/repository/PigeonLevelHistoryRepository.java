package com.commicom.itda.domain.pigeon.repository;

import com.commicom.itda.domain.pigeon.entity.PigeonLevelHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PigeonLevelHistoryRepository extends JpaRepository<PigeonLevelHistory, Long> {

    Slice<PigeonLevelHistory> findByMemberIdOrderByIdDesc(Long memberId, Pageable pageable);

    int countByMemberIdAndGenerationAndRewardType(Long memberId, int generation, PigeonLevelHistory.RewardType rewardType);

    void deleteByMemberId(Long memberId);
}
