package com.commicom.itda.infra.tts;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.Engine;
import software.amazon.awssdk.services.polly.model.OutputFormat;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechResponse;
import software.amazon.awssdk.services.polly.model.VoiceId;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class TtsService {

    private final PollyClient pollyClient;

    @Value("${aws.polly.voice-id}")
    private String voiceId;

    /**
     * 텍스트를 MP3 오디오로 변환한다.
     *
     * @return MP3 바이트 배열
     */
    public byte[] synthesize(String text) {
        log.info("TTS 변환 요청: {}자", text.length());
        SynthesizeSpeechRequest request = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.fromValue(voiceId))
                .outputFormat(OutputFormat.MP3)
                .engine(Engine.NEURAL)
                .languageCode("ko-KR")
                .build();

        try (ResponseInputStream<SynthesizeSpeechResponse> response = pollyClient.synthesizeSpeech(request)) {
            byte[] audioBytes = response.readAllBytes();
            log.info("TTS 완료: {}bytes", audioBytes.length);
            return audioBytes;
        } catch (IOException e) {
            throw new RuntimeException("TTS 변환 실패: " + e.getMessage(), e);
        }
    }
}
