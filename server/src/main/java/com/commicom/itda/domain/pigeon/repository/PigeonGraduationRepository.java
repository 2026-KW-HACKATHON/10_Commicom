package com.commicom.itda.domain.pigeon.repository;

import com.commicom.itda.domain.pigeon.entity.PigeonGraduation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PigeonGraduationRepository extends JpaRepository<PigeonGraduation, Long> {

    List<PigeonGraduation> findAllByMemberIdOrderByGenerationDesc(Long memberId);

    void deleteByMemberId(Long memberId);
}
