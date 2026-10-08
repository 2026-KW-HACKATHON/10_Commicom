package com.commicom.itda.domain.scrap.service;

import com.commicom.itda.domain.member.entity.Member;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.scrap.dto.ScrapShortformListResponse;
import com.commicom.itda.domain.scrap.dto.ScrapShortformResponse;
import com.commicom.itda.domain.scrap.entity.ShortformScrap;
import com.commicom.itda.domain.scrap.repository.ShortformScrapRepository;
import com.commicom.itda.domain.shortform.entity.Shortform;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** 숏폼 스크랩 (피드의 🔖 → 메뉴 > 스크랩한 영상) */
@Service
@RequiredArgsConstructor
public class ShortformScrapService {

    private final ShortformScrapRepository shortformScrapRepository;
    private final MemberRepository memberRepository;
    private final ShortformRepository shortformRepository;

    @Transactional
    public ScrapShortformResponse addScrap(Long memberId, Long shortformId) {
        Member member = findMember(memberId);
        Shortform shortform = findShortform(shortformId);

        if (shortformScrapRepository.existsByMemberAndShortform(member, shortform)) {
            throw new BusinessException(ErrorCode.SCRAP_SHORTFORM_ALREADY_EXISTS);
        }

        ShortformScrap scrap = shortformScrapRepository.save(ShortformScrap.builder()
                .member(member)
                .shortform(shortform)
                .build());

        return ScrapShortformResponse.from(scrap);
    }

    @Transactional
    public void removeScrap(Long memberId, Long shortformId) {
        Member member = findMember(memberId);
        Shortform shortform = findShortform(shortformId);

        ShortformScrap scrap = shortformScrapRepository.findByMemberAndShortform(member, shortform)
                .orElseThrow(() -> new BusinessException(ErrorCode.SCRAP_SHORTFORM_NOT_FOUND));

        shortformScrapRepository.delete(scrap);
    }

    @Transactional(readOnly = true)
    public ScrapShortformListResponse getMyScraps(Long memberId) {
        Member member = findMember(memberId);

        List<ScrapShortformResponse> shortforms = shortformScrapRepository.findAllByMemberOrderByCreatedAtDesc(member)
                .stream().map(ScrapShortformResponse::from).toList();

        return new ScrapShortformListResponse(shortforms.size(), shortforms);
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private Shortform findShortform(Long shortformId) {
        return shortformRepository.findById(shortformId)
                .filter(Shortform::isPublished)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHORTFORM_NOT_FOUND));
    }
}
