package com.commicom.itda.domain.pigeon.controller;

import com.commicom.itda.domain.pigeon.dto.PigeonDtos.AdFeedRequest;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.Album;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.GraduateResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.FeedPigeonResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.FeedRequest;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.FeedResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.HistoryPage;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.PigeonResponse;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.VoucherExchangeResult;
import com.commicom.itda.domain.pigeon.dto.PigeonDtos.VoucherList;
import com.commicom.itda.domain.pigeon.service.PigeonService;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Pigeon", description = "비둘기 키우기 (알·부화·먹이·레벨업·뽑기·졸업)")
@RestController
@RequestMapping("/api/pigeon")
@RequiredArgsConstructor
public class PigeonController {

    private final PigeonService pigeonService;

    @Operation(summary = "내 비둘기 조회",
            description = "처음 조회하면 알(Lv.0)을 준다. breed: 비둘기 종류(알이면 null), generation: 몇 번째 비둘기, today: 오늘 무료 먹이·광고 보상 현황")
    @GetMapping
    public ApiResponse<PigeonResponse> getPigeon(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(pigeonService.getPigeon(memberId));
    }

    @Operation(summary = "하루 무료 먹이 받기", description = "하루(KST) 1번, 먹이 1개를 보유 먹이에 더한다")
    @PostMapping("/feeds/daily")
    public ApiResponse<FeedResult> claimDaily(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(pigeonService.claimDaily(memberId));
    }

    @Operation(summary = "광고 보고 먹이 받기", description = "광고 1번 = 먹이 1개, 하루 3번. adTransactionId 로 중복 지급을 막는다")
    @PostMapping("/feeds/ad")
    public ApiResponse<FeedResult> claimAd(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody AdFeedRequest request) {
        return ApiResponse.onSuccess(pigeonService.claimAd(memberId, request.adTransactionId()));
    }

    @Operation(summary = "먹이 주기",
            description = "보유 먹이 amount 개를 먹인다. 알은 먹이 1개로 부화(hatched: 랜덤 종류), 그 뒤로는 필요 먹이를 채울 때마다 레벨업 + 뽑기(먹이 1·2개 또는 쿠폰)")
    @PostMapping("/feed")
    public ApiResponse<FeedPigeonResult> feed(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody FeedRequest request) {
        return ApiResponse.onSuccess(pigeonService.feed(memberId, request.amount()));
    }

    @Operation(summary = "졸업", description = "Lv.10 비둘기를 졸업시켜 앨범에 남기고 새 알을 받는다. 보유 먹이는 이어진다")
    @PostMapping("/graduate")
    public ApiResponse<GraduateResult> graduate(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(pigeonService.graduate(memberId));
    }

    @Operation(summary = "내 쿠폰 교환권",
            description = "레벨업 뽑기에서 쿠폰이 나왔는데 쿠폰 풀이 비어 받은 교환권. 3주 안에 쿠폰으로 바꿀 수 있고, 기한이 지나면 먹이 4개로 바뀐다"
                    + " (조회할 때 처리). poolAvailable: 지금 바꿀 쿠폰이 있는지")
    @GetMapping("/vouchers")
    public ApiResponse<VoucherList> getVouchers(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(pigeonService.getVouchers(memberId));
    }

    @Operation(summary = "교환권을 쿠폰으로 바꾸기",
            description = "사장님들이 내놓은 비둘기 보상 쿠폰 중 남은 수량 비례로 1장. 쿠폰이 없으면 VOUCHER409_2, 이미 바꿨으면 VOUCHER409."
                    + " 기한이 이미 지났으면 먹이로 바뀌고 feedGained 에 담김")
    @PostMapping("/vouchers/{voucherId}/exchange")
    public ApiResponse<VoucherExchangeResult> exchangeVoucher(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @PathVariable Long voucherId) {
        return ApiResponse.onSuccess(pigeonService.exchangeVoucher(memberId, voucherId));
    }

    @Operation(summary = "내 비둘기 앨범", description = "졸업한 비둘기 (최근 순): 기수·종류·키운 기간·받은 쿠폰 수")
    @GetMapping("/album")
    public ApiResponse<Album> getAlbum(@Parameter(hidden = true) @AuthenticationPrincipal Long memberId) {
        return ApiResponse.onSuccess(pigeonService.getAlbum(memberId));
    }

    @Operation(summary = "레벨업 기록 조회", description = "최근 순. size 최대 50. generation: 몇 번째 비둘기의 기록인지")
    @GetMapping("/history")
    public ApiResponse<HistoryPage> getHistory(
            @Parameter(hidden = true) @AuthenticationPrincipal Long memberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.onSuccess(pigeonService.getHistory(memberId, page, size));
    }
}
