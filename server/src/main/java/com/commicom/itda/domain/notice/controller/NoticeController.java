package com.commicom.itda.domain.notice.controller;

import com.commicom.itda.domain.notice.entity.Notice;
import com.commicom.itda.domain.notice.repository.NoticeRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.global.util.KstTime;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;

@Tag(name = "Notice", description = "공지사항 (작성은 관리자 API)")
@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeRepository noticeRepository;

    public record NoticeResponse(Long noticeId, String title, String body, boolean pinned, OffsetDateTime createdAt) {
        public static NoticeResponse from(Notice n) {
            return new NoticeResponse(n.getId(), n.getTitle(), n.getBody(), n.isPinned(), KstTime.fromServerTime(n.getCreatedAt()));
        }
    }

    public record NoticeList(List<NoticeResponse> notices) {
    }

    @Operation(summary = "공지사항 목록 (로그인 불필요)", description = "고정 공지 먼저, 그다음 최신 순")
    @GetMapping
    public ApiResponse<NoticeList> list() {
        return ApiResponse.onSuccess(new NoticeList(noticeRepository.findAllByOrderByPinnedDescIdDesc().stream().map(NoticeResponse::from).toList()));
    }

    @Operation(summary = "공지사항 상세 (로그인 불필요)")
    @GetMapping("/{noticeId}")
    public ApiResponse<NoticeResponse> get(@PathVariable Long noticeId) {
        return ApiResponse.onSuccess(noticeRepository.findById(noticeId).map(NoticeResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND)));
    }
}
