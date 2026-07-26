package com.moca.platform.SpeechLayer;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "speech")
public class SpeechProperties {

    /** Master switch — when false, /api/speech/* returns unavailable and submit skips AI STT. */
    private boolean enabled = false;

    /** OpenAI (or compatible) API key. Never expose to the frontend. */
    private String apiKey = "";

    /** API host, e.g. https://api.openai.com or a compatible proxy. */
    private String baseUrl = "https://api.openai.com";

    /** Whisper model id (whisper-1 on OpenAI). */
    private String model = "whisper-1";

    /** BCP-47 / ISO language hint for Whisper (vi = Vietnamese). */
    private String language = "vi";

    /** HTTP timeout for transcription calls (seconds). */
    private int timeoutSeconds = 60;

    public boolean isConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
