package com.moca.platform.Dto.ai;

/** AI assist transcript (yellow). Doctor score remains green / source of truth. */
public record WhisperTranscribeResponse(
        String transcript, String language, String provider, String model) {}
