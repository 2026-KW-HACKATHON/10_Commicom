package com.commicom.itda.domain.feedback.controller;

import com.commicom.itda.domain.feedback.entity.Feedback;
import com.commicom.itda.domain.feedback.repository.FeedbackRepository;
import com.commicom.itda.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Feedback", description = "의견 남기기")
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;

    public record FeedbackRequest(
            @Min(1) @Max(5) int rating,
            @Size(max = 1000) String good,
            @Size(max = 1000) String bad,
            @Pattern(regexp = "USER|OWNER") String mode,
            boolean beta
    ) {
    }

    public record FeedbackResponse(Long feedbackId) {
    }

    @Operation(summary = "의견 남기기 (로그인 불필요)", description = "별점 1~5 + 좋았던 점·아쉬운 점(각 1000자까지). 관리자 화면에서 모아 봄")
    @PostMapping
    @Transactional
    public ApiResponse<FeedbackResponse> create(@Valid @RequestBody FeedbackRequest request) {
        Feedback saved = feedbackRepository.save(new Feedback(request.rating(), blankToNull(request.good()), blankToNull(request.bad()),
                request.mode(), request.beta()));
        return ApiResponse.onSuccess(new FeedbackResponse(saved.getId()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }
}
