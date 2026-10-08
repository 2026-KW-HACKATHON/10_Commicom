package com.commicom.itda.domain.pigeon.repository;

import com.commicom.itda.domain.pigeon.entity.Pigeon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PigeonRepository extends JpaRepository<Pigeon, Long> {

    Optional<Pigeon> findByMemberId(Long memberId);

    void deleteByMemberId(Long memberId);
}
