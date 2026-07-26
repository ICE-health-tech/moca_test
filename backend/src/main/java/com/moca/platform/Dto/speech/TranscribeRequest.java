package com.moca.platform.Dto.speech;

import jakarta.validation.constraints.NotBlank;

public record TranscribeRequest(
        /** Raw Base64 or a {@code data:audio/...;base64,...} data URL. */
        @NotBlank String audioBase64,
        String contentType,
        String filename,
        /** When set, server scores MoCA sentence repetition (0 or 1). */
        String expectedSentence) {}
