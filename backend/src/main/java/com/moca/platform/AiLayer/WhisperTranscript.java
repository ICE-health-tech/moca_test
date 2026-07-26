package com.moca.platform.AiLayer;

/** Result of a Whisper ASR call (AI assist — yellow; not final doctor score). */
public record WhisperTranscript(String text, String language, String provider, String model) {}
