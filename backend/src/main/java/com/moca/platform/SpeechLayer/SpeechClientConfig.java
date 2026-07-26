package com.moca.platform.SpeechLayer;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@ConditionalOnProperty(name = "speech.enabled", havingValue = "true")
public class SpeechClientConfig {

    @Bean
    @Qualifier("speechRestClient")
    RestClient speechRestClient(SpeechProperties props) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofSeconds(Math.max(5, props.getTimeoutSeconds())));
        return RestClient.builder()
                .baseUrl(trimTrailingSlash(props.getBaseUrl()))
                .requestFactory(factory)
                .defaultHeader("Authorization", "Bearer " + props.getApiKey())
                .build();
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "https://api.openai.com";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
