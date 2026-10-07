package com.commicom.itda.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 숏폼 생성 작업 전용 스레드 풀.
 * FFmpeg 합성이 CPU를 많이 쓰므로 동시 실행 수를 작게 잡는다.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    public static final String VIDEO_GENERATION_EXECUTOR = "videoGenerationExecutor";

    @Bean(name = VIDEO_GENERATION_EXECUTOR)
    public Executor videoGenerationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("video-gen-");
        executor.initialize();
        return executor;
    }
}
