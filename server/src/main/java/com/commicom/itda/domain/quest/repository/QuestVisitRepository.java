package com.commicom.itda.domain.quest.repository;

import com.commicom.itda.domain.quest.entity.QuestVisit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface QuestVisitRepository extends JpaRepository<QuestVisit, Long> {

    List<QuestVisit> findAllByMemberId(Long memberId);

    boolean existsByMemberIdAndStoreIdAndVisitDate(Long memberId, Long storeId, LocalDate visitDate);

    boolean existsByMemberIdAndQuestIdAndStoreId(Long memberId, Long questId, Long storeId);

    int countByMemberIdAndQuestId(Long memberId, Long questId);

    void deleteByMemberId(Long memberId);
}
