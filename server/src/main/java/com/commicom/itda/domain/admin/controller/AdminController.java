package com.commicom.itda.domain.admin.controller;

import com.commicom.itda.domain.coupon.entity.CouponStatus;
import com.commicom.itda.domain.coupon.repository.CouponRepository;
import com.commicom.itda.domain.coupon.service.CouponService;
import com.commicom.itda.domain.event.entity.EarlyOwnerReward;
import com.commicom.itda.domain.event.repository.EarlyOwnerRewardRepository;
import com.commicom.itda.domain.feedback.entity.Feedback;
import com.commicom.itda.domain.feedback.repository.FeedbackRepository;
import com.commicom.itda.domain.member.entity.Role;
import com.commicom.itda.domain.member.repository.MemberRepository;
import com.commicom.itda.domain.notice.controller.NoticeController.NoticeResponse;
import com.commicom.itda.domain.notice.entity.Notice;
import com.commicom.itda.domain.notice.repository.NoticeRepository;
import com.commicom.itda.domain.pigeon.entity.CouponVoucher;
import com.commicom.itda.domain.pigeon.repository.CouponVoucherRepository;
import com.commicom.itda.domain.shortform.repository.ShortformRepository;
import com.commicom.itda.domain.store.entity.Store;
import com.commicom.itda.domain.store.repository.StoreRepository;
import com.commicom.itda.global.exception.BusinessException;
import com.commicom.itda.global.exception.ErrorCode;
import com.commicom.itda.global.response.ApiResponse;
import com.commicom.itda.global.util.KstTime;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 관리자 화면 (role ADMIN 만, SecurityConfig 에서 /api/admin/** 제한) */
@Tag(name = "Admin", description = "관리자: 현황·의견·이벤트 당첨 가게·공지 작성")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminController {

    private final MemberRepository memberRepository;
    private final StoreRepository storeRepository;
    private final ShortformRepository shortformRepository;
    private final CouponRepository couponRepository;
    private final CouponService couponService;
    private final CouponVoucherRepository voucherRepository;
    private final FeedbackRepository feedbackRepository;
    private final EarlyOwnerRewardRepository earlyOwnerRewardRepository;
    private final NoticeRepository noticeRepository;

    public record Summary(long residents, long owners, long stores, long shortforms, long activeCoupons, boolean rewardPool,
                          long vouchersWaiting, long feedbacks, double averageRating, long earlyOwners) {
    }

    public record FeedbackItem(Long feedbackId, int rating, String good, String bad, String mode, boolean beta, OffsetDateTime createdAt) {
    }

    public record FeedbackPage(List<FeedbackItem> feedbacks, int page, int size, boolean hasNext) {
    }

    public record EarlyOwnerItem(Long storeId, String storeName, Long couponId, OffsetDateTime grantedAt) {
    }

    public record NoticeRequest(@NotBlank @Size(max = 100) String title, @NotBlank @Size(max = 5000) String body, boolean pinned) {
    }

    @Operation(summary = "현황", description = "회원·가게·게시물·쿠폰·교환권·의견·이벤트 숫자")
    @GetMapping("/summary")
    public ApiResponse<Summary> summary() {
        return ApiResponse.onSuccess(new Summary(
                memberRepository.countByRole(Role.RESIDENT),
                memberRepository.countByRole(Role.OWNER),
                storeRepository.count(),
                shortformRepository.count(),
                couponRepository.countByStatus(CouponStatus.ACTIVE),
                couponService.hasPigeonRewardPool(),
                voucherRepository.countByStatus(CouponVoucher.Status.ISSUED),
                feedbackRepository.count(),
                Math.round(feedbackRepository.averageRating() * 10) / 10.0,
                earlyOwnerRewardRepository.count()));
    }

    @Operation(summary = "의견 목록", description = "최신 순, size 최대 100")
    @GetMapping("/feedback")
    public ApiResponse<FeedbackPage> feedback(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        Slice<Feedback> slice = feedbackRepository.findAllByOrderByIdDesc(PageRequest.of(page, size));
        return ApiResponse.onSuccess(new FeedbackPage(slice.getContent().stream()
                .map(f -> new FeedbackItem(f.getId(), f.getRating(), f.getGood(), f.getBad(), f.getMode(), f.isBeta(),
                        KstTime.fromServerTime(f.getCreatedAt())))
                .toList(), page, size, slice.hasNext()));
    }

    @Operation(summary = "초기 사장님 이벤트 당첨 가게", description = "당첨 순서대로")
    @GetMapping("/early-owner")
    public ApiResponse<List<EarlyOwnerItem>> earlyOwners() {
        List<EarlyOwnerReward> rewards = earlyOwnerRewardRepository.findAll().stream()
                .sorted((a, b) -> a.getGrantedAt().compareTo(b.getGrantedAt()))
                .toList();
        Map<Long, String> names = storeRepository.findAllById(rewards.stream().map(EarlyOwnerReward::getStoreId).toList()).stream()
                .collect(Collectors.toMap(Store::getId, Store::getName));
        return ApiResponse.onSuccess(rewards.stream()
                .map(r -> new EarlyOwnerItem(r.getStoreId(), names.getOrDefault(r.getStoreId(), "가게 " + r.getStoreId()), r.getCouponId(),
                        KstTime.offset(r.getGrantedAt())))
                .toList());
    }

    @Operation(summary = "공지 작성")
    @PostMapping("/notices")
    @Transactional
    public ApiResponse<NoticeResponse> createNotice(@Valid @RequestBody NoticeRequest request) {
        return ApiResponse.onSuccess(NoticeResponse.from(noticeRepository.save(new Notice(request.title().strip(), request.body().strip(), request.pinned()))));
    }

    @Operation(summary = "공지 수정")
    @PatchMapping("/notices/{noticeId}")
    @Transactional
    public ApiResponse<NoticeResponse> updateNotice(@PathVariable Long noticeId, @Valid @RequestBody NoticeRequest request) {
        Notice notice = noticeRepository.findById(noticeId).orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        notice.update(request.title().strip(), request.body().strip(), request.pinned());
        return ApiResponse.onSuccess(NoticeResponse.from(notice));
    }

    @Operation(summary = "공지 삭제")
    @DeleteMapping("/notices/{noticeId}")
    @Transactional
    public ApiResponse<Map<String, Long>> deleteNotice(@PathVariable Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId).orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        noticeRepository.delete(notice);
        return ApiResponse.onSuccess(Map.of("noticeId", noticeId));
    }
}
