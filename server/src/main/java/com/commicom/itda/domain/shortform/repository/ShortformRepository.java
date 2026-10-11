package com.commicom.itda.domain.shortform.repository;

import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.store.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface ShortformRepository extends JpaRepository<Shortform, Long> {

    /** 가게별 피드: 공개한 게시물만 */
    Page<Shortform> findAllByStoreAndPublishedTrue(Store store, Pageable pageable);

    /** 전체 피드: 공개한 게시물만, PRO 이용 중인 가게 게시물을 앞에, 그 안에서는 최신순 */
    // 관리자 가게 게시물은 빼고 (시연·확인용이라 손님에게 숨김)
    @Query(value = "select s from Shortform s join s.store st left join st.owner o"
            + " left join ProSubscription p on p.storeId = st.id and p.expiresAt > :now"
            + " where s.published = true and (o is null or o.role <> com.commicom.itda.domain.member.entity.Role.ADMIN)"
            + " order by case when p.id is null then 1 else 0 end, s.createdAt desc, s.id desc",
            countQuery = "select count(s) from Shortform s join s.store st left join st.owner o"
                    + " where s.published = true and (o is null or o.role <> com.commicom.itda.domain.member.entity.Role.ADMIN)")
    Page<Shortform> findFeedProFirst(LocalDateTime now, Pageable pageable);
}
