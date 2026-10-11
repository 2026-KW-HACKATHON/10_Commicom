package com.commicom.itda.domain.store.repository;

import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.entity.StoreCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    List<Store> findAllByCategory(StoreCategory category);

    Optional<Store> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);

    /** 관리자 계정이 등록한 가게 (시연·확인용이라 손님에게는 숨김) */
    @Query("select s.id from Store s where s.owner.role = com.commicom.itda.domain.member.entity.Role.ADMIN")
    List<Long> findAdminStoreIds();
}
