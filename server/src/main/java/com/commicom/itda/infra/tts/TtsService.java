package com.commicom.itda.infra.tts;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.Engine;
import software.amazon.awssdk.services.polly.model.OutputFormat;
import software.amazon.awssdk.services.polly.model.SpeechMarkType;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechResponse;
import software.amazon.awssdk.services.polly.model.VoiceId;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TtsService {

    private final PollyClient pollyClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 단어별 발화 타이밍 정보 */
    public record WordMark(int timeMs, String value) {}

    /** 오디오 + 단어 타이밍을 함께 반환 */
    public record TtsResult(byte[] audioBytes, List<WordMark> words) {}

    /**
     * 텍스트를 MP3 오디오로 변환한다.
     */
    public byte[] synthesize(String text) {
        log.info("TTS 변환 요청: {}자", text.length());
        SynthesizeSpeechRequest request = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.SEOYEON)
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

    /**
     * 텍스트를 MP3 오디오로 변환하고, 단어별 발화 타이밍(Speech Marks)도 함께 반환한다.
     * Speech Marks 조회 실패 시 빈 word 목록으로 폴백.
     */
    public TtsResult synthesizeWithMarks(String text) {
        byte[] audioBytes = synthesize(text);
        List<WordMark> words = fetchSpeechMarks(text);
        log.info("Speech Marks: {}개 단어", words.size());
        return new TtsResult(audioBytes, words);
    }

    /**
     * Polly Speech Marks API로 단어별 타이밍 조회.
     * JSON Lines 형식 응답: {"time":0,"type":"word","start":0,"end":5,"value":"안녕"}
     */
    private List<WordMark> fetchSpeechMarks(String text) {
        SynthesizeSpeechRequest request = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.SEOYEON)
                .outputFormat(OutputFormat.JSON)
                .speechMarkTypes(SpeechMarkType.WORD)
                .engine(Engine.NEURAL)
                .languageCode("ko-KR")
                .build();

        try (ResponseInputStream<SynthesizeSpeechResponse> response = pollyClient.synthesizeSpeech(request)) {
            String jsonLines = new String(response.readAllBytes(), StandardCharsets.UTF_8);
            List<WordMark> marks = new ArrayList<>();
            for (String line : jsonLines.split("\n")) {
                line = line.trim();
                if (line.isEmpty()) continue;
                JsonNode node = objectMapper.readTree(line);
                marks.add(new WordMark(node.get("time").asInt(), node.get("value").asText()));
            }
            return marks;
        } catch (Exception e) {
            log.warn("Speech marks 조회 실패, 균등 분배로 폴백: {}", e.getMessage());
            return List.of();
        }
    }
}
