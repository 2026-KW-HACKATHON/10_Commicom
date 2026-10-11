package com.commicom.itda.domain.member.repository;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    /** 닉네임 수정: 나를 뺀 다른 회원이 쓰고 있는지 */
    boolean existsByNicknameAndIdNot(String nickname, Long id);

    /** 관리자 화면 현황 */
    long countByRole(Role role);
}
