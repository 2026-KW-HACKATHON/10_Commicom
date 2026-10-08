package com.commicom.itda.domain.quest.repository;

import com.commicom.itda.domain.quest.entity.QuestParticipation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestParticipationRepository extends JpaRepository<QuestParticipation, Long> {

    List<QuestParticipation> findAllByQuestIdIn(List<Long> questIds);

    boolean existsByQuestIdAndStoreId(Long questId, Long storeId);

    void deleteByQuestIdAndStoreId(Long questId, Long storeId);
}
