package com.commicom.itda.domain.quest.repository;

import com.commicom.itda.domain.quest.entity.QuestCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestCompletionRepository extends JpaRepository<QuestCompletion, Long> {

    boolean existsByMemberIdAndQuestId(Long memberId, Long questId);

    void deleteByMemberId(Long memberId);
}
