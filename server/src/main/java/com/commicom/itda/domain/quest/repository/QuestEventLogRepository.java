package com.commicom.itda.domain.quest.repository;

import com.commicom.itda.domain.quest.entity.QuestEventLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestEventLogRepository extends JpaRepository<QuestEventLog, Long> {

    List<QuestEventLog> findAllByMemberId(Long memberId);

    boolean existsByMemberIdAndQuestIdAndTargetId(Long memberId, Long questId, Long targetId);

    int countByMemberIdAndQuestId(Long memberId, Long questId);

    void deleteByMemberId(Long memberId);
}
