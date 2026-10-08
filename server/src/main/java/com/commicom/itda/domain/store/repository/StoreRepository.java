package com.commicom.itda.domain.store.repository;

import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    List<Store> findAllByCategory(StoreCategory category);

    Optional<Store> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);
}
