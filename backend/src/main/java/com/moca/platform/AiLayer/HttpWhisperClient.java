package com.moca.platform.AiLayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * Calls OpenAI {@code /audio/transcriptions} or local ASR {@code /asr}.
 *
 * <p>Provider is selected by {@code whisper.provider} (openai | local).
 */
@Component
public class HttpWhisperClient implements WhisperClient {

    private final WhisperProperties props;
    private final ObjectMapper objectMapper;

    public HttpWhisperClient(WhisperProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @Override
    public WhisperTranscript transcribe(byte[] audio, String filename, String contentType) {
        String provider = normalizeProvider(props.getProvider());
        try {
            return switch (provider) {
                case "local" -> transcribeLocal(audio, filename, contentType);
                case "openai" -> transcribeOpenAi(audio, filename, contentType);
                default -> throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "WHISPER_PROVIDER không hợp lệ (openai|local): " + props.getProvider());
            };
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RestClientException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Whisper ASR không phản hồi: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Whisper ASR lỗi: " + e.getMessage(), e);
        }
    }

    private WhisperTranscript transcribeOpenAi(byte[] audio, String filename, String contentType) {
        if (props.getApiKey() == null || props.getApiKey().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Thiếu WHISPER_API_KEY cho provider openai");
        }

        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("file", audioResource(audio, filename))
                .contentType(resolveAudioType(contentType));
        body.part("model", props.getModel());
        if (props.getLanguage() != null && !props.getLanguage().isBlank()) {
            body.part("language", props.getLanguage());
        }
        body.part("response_format", "json");

        String raw = restClient()
                .post()
                .uri("/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .header("Authorization", "Bearer " + props.getApiKey())
                .body(body.build())
                .retrieve()
                .body(String.class);

        String text = readJsonText(raw, "text");
        return new WhisperTranscript(text, props.getLanguage(), "openai", props.getModel());
    }

    private WhisperTranscript transcribeLocal(byte[] audio, String filename, String contentType) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("audio_file", audioResource(audio, filename))
                .contentType(resolveAudioType(contentType));

        String language = props.getLanguage() == null || props.getLanguage().isBlank()
                ? "vi"
                : props.getLanguage();

        String raw = restClient()
                .post()
                .uri(uriBuilder -> uriBuilder
                        .path("/asr")
                        .queryParam("task", "transcribe")
                        .queryParam("language", language)
                        .queryParam("output", "json")
                        .build())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body.build())
                .retrieve()
                .body(String.class);

        String text = extractLocalText(raw);
        return new WhisperTranscript(text, language, "local", props.getModel());
    }

    private RestClient restClient() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofMillis(Math.max(1_000, props.getTimeoutMs())));
        return RestClient.builder()
                .baseUrl(trimTrailingSlash(props.getBaseUrl()))
                .requestFactory(factory)
                .build();
    }

    private ByteArrayResource audioResource(byte[] audio, String filename) {
        String name = (filename == null || filename.isBlank()) ? "audio.webm" : filename;
        return new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return name;
            }
        };
    }

    private MediaType resolveAudioType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.parseMediaType("audio/webm");
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String readJsonText(String raw, String field) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            JsonNode node = objectMapper.readTree(raw);
            JsonNode text = node.get(field);
            return text == null || text.isNull() ? "" : text.asText("").trim();
        } catch (Exception e) {
            throw new IllegalStateException("Whisper response JSON không hợp lệ", e);
        }
    }

    /** Local ASR json may be {@code {"text":"..."}} or a plain string body. */
    private String extractLocalText(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        if (trimmed.startsWith("{")) {
            try {
                return readJsonText(trimmed, "text");
            } catch (RuntimeException ignored) {
                return trimmed;
            }
        }
        return trimmed;
    }

    private static String normalizeProvider(String provider) {
        return provider == null ? "" : provider.trim().toLowerCase();
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
