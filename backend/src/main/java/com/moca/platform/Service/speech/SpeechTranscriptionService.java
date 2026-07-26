package com.moca.platform.Service.speech;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moca.platform.SpeechLayer.SpeechProperties;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Server-side STT via OpenAI Whisper (or compatible) API.
 * Improves Vietnamese sentence-repetition quality vs browser Web Speech.
 */
@Service
public class SpeechTranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SpeechTranscriptionService.class);
    private static final Pattern DATA_URL =
            Pattern.compile("^data:([^;]+);base64,(.+)$", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private final SpeechProperties props;
    private final RestClient speechRestClient;
    private final ObjectMapper objectMapper;
    private final SentenceRepetitionScorer scorer;

    public SpeechTranscriptionService(
            SpeechProperties props,
            @Autowired(required = false) @Qualifier("speechRestClient") RestClient speechRestClient,
            ObjectMapper objectMapper,
            SentenceRepetitionScorer scorer) {
        this.props = props;
        this.speechRestClient = speechRestClient;
        this.objectMapper = objectMapper;
        this.scorer = scorer;
    }

    public boolean isAvailable() {
        return props.isConfigured() && speechRestClient != null;
    }

    public String provider() {
        return isAvailable() ? "openai-whisper" : "none";
    }

    public TranscriptionResult transcribe(
            String audioBase64OrDataUrl, String contentType, String filename, String expectedSentence) {
        if (!isAvailable()) {
            throw new IllegalStateException("Speech transcription is disabled or not configured");
        }

        DecodedAudio audio = decodeAudio(audioBase64OrDataUrl, contentType, filename);
        String transcript = callWhisper(audio);
        Integer score = null;
        Double matchRatio = null;
        if (expectedSentence != null && !expectedSentence.isBlank() && !transcript.isBlank()) {
            SentenceRepetitionScorer.ScoreResult scored = scorer.score(expectedSentence, transcript);
            score = scored.score();
            matchRatio = scored.matchRatio();
        }
        return new TranscriptionResult(transcript, provider(), props.getLanguage(), score, matchRatio);
    }

    private String callWhisper(DecodedAudio audio) {
        MultiValueMap<String, Object> multipart = new LinkedMultiValueMap<>();
        multipart.add(
                "file",
                new ByteArrayResource(audio.bytes()) {
                    @Override
                    public String getFilename() {
                        return audio.filename();
                    }
                });
        multipart.add("model", props.getModel());
        multipart.add("language", props.getLanguage());
        multipart.add("response_format", "json");

        try {
            // Do not set Content-Type manually — FormHttpMessageConverter adds the multipart boundary.
            String body = speechRestClient
                    .post()
                    .uri("/v1/audio/transcriptions")
                    .body(multipart)
                    .retrieve()
                    .body(String.class);
            if (body == null || body.isBlank()) {
                throw new IllegalStateException("Empty transcription response");
            }
            JsonNode root = objectMapper.readTree(body);
            String text = root.path("text").asText("").trim();
            log.debug("Whisper transcription length={}", text.length());
            return text;
        } catch (RestClientException e) {
            throw new IllegalStateException("Speech API request failed: " + e.getMessage(), e);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse speech API response", e);
        }
    }

    static DecodedAudio decodeAudio(String audioBase64OrDataUrl, String contentType, String filename) {
        if (audioBase64OrDataUrl == null || audioBase64OrDataUrl.isBlank()) {
            throw new IllegalArgumentException("audioBase64 is required");
        }
        String raw = audioBase64OrDataUrl.trim();
        String type = contentType != null && !contentType.isBlank() ? contentType : "audio/webm";
        String name = filename != null && !filename.isBlank() ? filename : "recording.webm";

        Matcher matcher = DATA_URL.matcher(raw);
        if (matcher.matches()) {
            type = matcher.group(1);
            raw = matcher.group(2);
            if (name.equals("recording.webm") && type.contains("ogg")) {
                name = "recording.ogg";
            } else if (name.equals("recording.webm") && type.contains("mp4")) {
                name = "recording.mp4";
            } else if (name.equals("recording.webm") && type.contains("mpeg")) {
                name = "recording.mp3";
            } else if (name.equals("recording.webm") && type.contains("wav")) {
                name = "recording.wav";
            }
        }

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(raw.replaceAll("\\s", ""));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("audioBase64 is not valid Base64", e);
        }
        if (bytes.length == 0) {
            throw new IllegalArgumentException("audio payload is empty");
        }
        if (bytes.length > 25 * 1024 * 1024) {
            throw new IllegalArgumentException("audio payload exceeds 25MB limit");
        }
        return new DecodedAudio(bytes, type, name);
    }

    public record TranscriptionResult(
            String transcript, String provider, String language, Integer score, Double matchRatio) {}

    record DecodedAudio(byte[] bytes, String contentType, String filename) {}
}
