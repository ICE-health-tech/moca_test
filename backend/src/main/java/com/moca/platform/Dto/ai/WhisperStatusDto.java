package com.moca.platform.Dto.ai;

/** Public status — never includes API keys. */
public record WhisperStatusDto(
        boolean enabled, String provider, String model, String language, String baseUrl) {}
