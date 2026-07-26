package com.moca.platform.AiLayer;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(WhisperProperties.class)
public class WhisperPropertiesConfig {
}
