package com.commicom.itda.domain.quest.service;

import com.commicom.itda.domain.quest.entity.Quest;
import com.commicom.itda.domain.quest.entity.QuestEventType;
import com.commicom.itda.domain.quest.entity.QuestTemplate;
import com.commicom.itda.domain.quest.repository.QuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 고정 퀘스트를 채운다 (모든 프로필). 이미 있으면 빠진 템플릿만 추가.
 * 로컬 샘플 데이터(LocalDataInitializer)보다 먼저 실행
 */
@Component
@Order(0)
@RequiredArgsConstructor
public class QuestSeeder implements ApplicationRunner {

    private final QuestRepository questRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Quest> quests = new ArrayList<>();
        if (questRepository.count() == 0) {
            quests.add(Quest.visit("동네 가게 3곳 방문하기", 3, 2));
            quests.add(Quest.basic("숏폼 5개 보기", 5, 1, QuestEventType.SHORTFORM_VIEW));
            quests.add(Quest.basic("지도에서 가게 3곳 둘러보기", 3, 1, QuestEventType.STORE_VIEW));
        }
        Set<String> existing = questRepository.findAll().stream()
                .map(Quest::getTemplateKey)
                .collect(Collectors.toSet());
        Arrays.stream(QuestTemplate.values())
                .filter(t -> !existing.contains(t.getKey()))
                .map(Quest::template)
                .forEach(quests::add);
        questRepository.saveAll(quests);
    }
}
