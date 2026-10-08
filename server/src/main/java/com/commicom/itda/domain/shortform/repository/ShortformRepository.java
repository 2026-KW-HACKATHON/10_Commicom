package com.commicom.itda.domain.shortform.repository;

import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.store.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShortformRepository extends JpaRepository<Shortform, Long> {

    Page<Shortform> findAllByStore(Store store, Pageable pageable);
}
