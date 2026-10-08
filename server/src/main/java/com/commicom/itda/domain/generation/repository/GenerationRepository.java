package com.commicom.itda.domain.generation.repository;

import com.commicom.itda.domain.generation.entity.Generation;
import com.commicom.itda.domain.generation.entity.GenerationStatus;
import com.commicom.itda.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GenerationRepository extends JpaRepository<Generation, Long> {

    boolean existsByStoreAndStatusIn(Store store, List<GenerationStatus> statuses);
}
