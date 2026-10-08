package com.commicom.itda.domain.quest.repository;

import com.commicom.itda.domain.quest.entity.Quest;
import com.commicom.itda.domain.quest.entity.QuestEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    List<Quest> findAllByOrderByIdAsc();

    Optional<Quest> findByTemplateKey(String templateKey);

    List<Quest> findAllByBasicEvent(QuestEventType basicEvent);
}
