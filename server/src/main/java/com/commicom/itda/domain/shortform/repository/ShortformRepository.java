package com.commicom.itda.domain.shortform.repository;

import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.store.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface ShortformRepository extends JpaRepository<Shortform, Long> {

    Page<Shortform> findAllByStore(Store store, Pageable pageable);

    /** 전체 피드: PRO 이용 중인 가게 영상을 앞에, 그 안에서는 최신순 */
    @Query(value = "select s from Shortform s left join ProSubscription p on p.storeId = s.store.id and p.expiresAt > :now"
            + " order by case when p.id is null then 1 else 0 end, s.createdAt desc, s.id desc",
            countQuery = "select count(s) from Shortform s")
    Page<Shortform> findFeedProFirst(LocalDateTime now, Pageable pageable);
}
