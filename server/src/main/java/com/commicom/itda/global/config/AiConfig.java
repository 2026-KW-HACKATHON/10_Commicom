package com.commicom.itda.global.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

@Configuration
public class AiConfig {

    @Bean
    @Lazy
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
