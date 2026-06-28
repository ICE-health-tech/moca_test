package com.moca.platform.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.moca.platform.ObjectDb.DrawingAnswerKeys;
import com.moca.platform.ObjectDb.ObjectStorageService;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DrawingAnswerService {

    private static final Pattern DATA_URL =
            Pattern.compile("^data:image/png;base64,(.+)$", Pattern.CASE_INSENSITIVE);

    private final Optional<ObjectStorageService> storage;
    private final ObjectMapper objectMapper;

    public DrawingAnswerService(
            @Autowired(required = false) ObjectStorageService storage, ObjectMapper objectMapper) {
        this.storage = Optional.ofNullable(storage);
        this.objectMapper = objectMapper;
    }

    /**
     * Upload Section 1 canvas PNGs to MinIO and replace data URLs with object refs.
     * When MinIO is disabled, data URLs are kept inline in raw_answers.
     */
    public String offloadDrawings(UUID sessionId, String rawAnswersJson) {
        if (storage.isEmpty()) {
            return rawAnswersJson;
        }
        ObjectStorageService objectStorage = storage.get();
        try {
            JsonNode root = objectMapper.readTree(rawAnswersJson);
            if (!root.isObject()) {
                return rawAnswersJson;
            }
            ObjectNode answers = (ObjectNode) root;
            for (String key : DrawingAnswerKeys.CANVAS_KEYS) {
                JsonNode value = answers.get(key);
                if (value == null || !value.isTextual()) {
                    continue;
                }
                String dataUrl = value.asText();
                Matcher matcher = DATA_URL.matcher(dataUrl);
                if (!matcher.matches()) {
                    continue;
                }
                byte[] png = Base64.getDecoder().decode(matcher.group(1));
                String objectKey = "sessions/" + sessionId + "/" + key + ".png";
                objectStorage.putPng(objectKey, png);
                ObjectNode ref = objectMapper.createObjectNode();
                ref.put("storage", "minio");
                ref.put("bucket", objectStorage.bucket());
                ref.put("objectKey", objectKey);
                ref.put("contentType", "image/png");
                
                
                answers.set(key, ref);
            }
            return objectMapper.writeValueAsString(answers);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid raw_answers JSON for drawing offload", e);
        }
    }
}
