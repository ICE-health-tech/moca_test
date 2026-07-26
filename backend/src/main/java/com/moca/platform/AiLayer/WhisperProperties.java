package com.moca.platform.AiLayer;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Whisper ASR env for MoCA section 5 (sentence repetition).
 * Yellow/AI assist only — doctor (green) still finalizes scores.
 *
 * Connect modes via env (see backend/.env.example):
 * - openai: OpenAI Whisper API (needs WHISPER_API_KEY)
 * - local:  self-hosted ASR webservice (docker profile local-whisper)
 */
@Data
@ConfigurationProperties(prefix = "whisper")
public class WhisperProperties {

    /** Master switch — when false, skip Whisper calls. */
    private boolean enabled = false;

    /** openai | local */
    private String provider = "openai";

    /**
     * OpenAI: https://api.openai.com/v1
     * Local:  http://localhost:9002  (compose profile local-whisper)
     */
    private String baseUrl = "https://api.openai.com/v1";

    /** Required for openai; leave empty for local. */
    private String apiKey = "";

    /** openai: whisper-1 · local: tiny|base|small|medium|large-v3 */
    private String model = "whisper-1";

    /** ISO-639-1 — MoCA Việt: vi */
    private String language = "vi";

    /** Request timeout in milliseconds */
    private int timeoutMs = 60_000;
}
