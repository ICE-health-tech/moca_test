package com.moca.platform.AiLayer;

/**
 * Low-level Whisper ASR transport (OpenAI API or local webservice).
 * Keep API keys here — never expose to the frontend.
 */
public interface WhisperClient {

    WhisperTranscript transcribe(byte[] audio, String filename, String contentType);
}
