package com.commicom.itda.domain.scrap.repository;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.scrap.entity.Scrap;
import com.commicom.itda.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScrapRepository extends JpaRepository<Scrap, Long> {

    List<Scrap> findAllByMemberOrderByCreatedAtDesc(Member member);

    boolean existsByMemberAndStore(Member member, Store store);

    Optional<Scrap> findByMemberAndStore(Member member, Store store);
}
