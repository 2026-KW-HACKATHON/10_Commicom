package com.commicom.itda.infra.video;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Profile("local")
public class MockVideoClipGenerator implements VideoClipGenerator {

    @Value("${video.ffmpeg-path:ffmpeg}")
    private String ffmpegPath;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    @Override
    public List<File> generateParallel(List<String> imageUrls, List<String> prompts, Path workDir) throws Exception {
        log.info("[Mock] Runway 없이 FFmpeg 정적 클립 {}개 생성", imageUrls.size());
        List<File> clips = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            File imgFile = workDir.resolve("mock_img_" + i + ".jpg").toFile();
            downloadFile(imageUrls.get(i), imgFile);

            File clipFile = workDir.resolve("cut" + (i + 1) + ".mp4").toFile();
            runProcess(List.of(
                    ffmpegPath,
                    "-loop", "1", "-i", imgFile.getAbsolutePath(),
                    "-t", "5",
                    "-vf", "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "28",
                    "-pix_fmt", "yuv420p",
                    "-y", clipFile.getAbsolutePath()
            ));
            log.info("[Mock] 클립 {} 생성 완료: {}KB", i + 1, clipFile.length() / 1024);
            clips.add(clipFile);
        }
        return clips;
    }

    private void downloadFile(String url, File dest) throws Exception {
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        Files.copy(response.body(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
    }

    private void runProcess(List<String> command) throws Exception {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        process.getInputStream().readAllBytes();
        int exit = process.waitFor();
        if (exit != 0) throw new RuntimeException("FFmpeg Mock 클립 생성 실패 (exit=" + exit + ")");
    }
}
