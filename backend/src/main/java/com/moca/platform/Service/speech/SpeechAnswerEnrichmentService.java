package com.moca.platform.Service.speech;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * On submit: re-transcribe Section 5 audio with Whisper when AI STT is configured,
 * replacing weaker browser transcripts for higher grading quality.
 */
@Service
public class SpeechAnswerEnrichmentService {

    private static final Logger log = LoggerFactory.getLogger(SpeechAnswerEnrichmentService.class);

    private final SpeechTranscriptionService speech;
    private final ObjectMapper objectMapper;

    public SpeechAnswerEnrichmentService(SpeechTranscriptionService speech, ObjectMapper objectMapper) {
        this.speech = speech;
        this.objectMapper = objectMapper;
    }

    /**
     * Returns a copy of {@code rawAnswers} with Section 5 enriched when AI STT is available.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> enrichSection5(Map<String, Object> rawAnswers) {
        if (rawAnswers == null) {
            return null;
        }
        if (!speech.isAvailable()) {
            return rawAnswers;
        }
        Object section5 = rawAnswers.get("section_5");
        if (!(section5 instanceof Map<?, ?> entries)) {
            return rawAnswers;
        }

        Map<String, Object> copy = new HashMap<>(rawAnswers);
        try {
            ObjectNode sectionNode = objectMapper.valueToTree(entries);
            Iterator<String> fieldNames = sectionNode.fieldNames();
            boolean changed = false;
            while (fieldNames.hasNext()) {
                String key = fieldNames.next();
                JsonNode entry = sectionNode.get(key);
                if (entry == null || !entry.isObject()) {
                    continue;
                }
                String audio = firstNonBlank(
                        text(entry, "audioDataUrl"),
                        text(entry, "audioBase64"),
                        dataUrlIfPresent(text(entry, "blobUrl")));
                if (audio == null) {
                    continue;
                }
                // Skip re-call when already AI-transcribed with text
                if ("openai-whisper".equals(text(entry, "asrProvider"))
                        && entry.hasNonNull("transcript")
                        && !entry.path("transcript").asText("").isBlank()) {
                    continue;
                }
                try {
                    String expected = text(entry, "expectedSentence");
                    SpeechTranscriptionService.TranscriptionResult result =
                            speech.transcribe(audio, "audio/webm", "section5_" + key + ".webm", expected);
                    ObjectNode mutable = (ObjectNode) entry;
                    mutable.put("transcript", result.transcript());
                    mutable.put("asrSupported", true);
                    mutable.put("asrProvider", result.provider());
                    if (result.score() != null) {
                        mutable.put("score", result.score());
                    }
                    if (result.matchRatio() != null) {
                        mutable.put("matchRatio", result.matchRatio());
                    }
                    changed = true;
                } catch (Exception e) {
                    log.warn("AI STT enrich failed for section_5.{}: {}", key, e.getMessage());
                }
            }
            if (changed) {
                copy.put("section_5", objectMapper.convertValue(sectionNode, Map.class));
                return copy;
            }
        } catch (Exception e) {
            log.warn("AI STT enrich skipped: {}", e.getMessage());
        }
        return rawAnswers;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull() || !v.isTextual()) {
            return null;
        }
        String s = v.asText();
        return s == null || s.isBlank() ? null : s;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    /** blob: URLs are browser-local — never send to Whisper. */
    private static String dataUrlIfPresent(String value) {
        if (value != null && value.startsWith("data:audio")) {
            return value;
        }
        return null;
    }
}
