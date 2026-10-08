package com.commicom.itda.domain.scrap.repository;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.scrap.entity.ShortformScrap;
import com.commicom.itda.domain.shortform.entity.Shortform;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShortformScrapRepository extends JpaRepository<ShortformScrap, Long> {

    /** 목록에서 숏폼·가게 이름을 같이 쓰므로 한 번에 불러옴 */
    @EntityGraph(attributePaths = {"shortform", "shortform.store"})
    List<ShortformScrap> findAllByMemberOrderByCreatedAtDesc(Member member);

    boolean existsByMemberAndShortform(Member member, Shortform shortform);

    Optional<ShortformScrap> findByMemberAndShortform(Member member, Shortform shortform);

    void deleteAllByMember(Member member);

    List<ShortformScrap> findAllByShortform(Shortform shortform);

    /** 숏폼을 지울 때 그 숏폼의 스크랩도 함께 지움 */
    void deleteAllByShortform(Shortform shortform);
}
