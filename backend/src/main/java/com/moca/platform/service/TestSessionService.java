package com.moca.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.moca.platform.dto.SubmitTestSessionRequest;
import com.moca.platform.dto.TestSessionSummaryDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moca.platform.DataLayer.protocol.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
import com.moca.platform.ObjectDb.DrawingAnswerKeys;
import com.moca.platform.ObjectDb.ObjectStorageService;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestSessionService {

    private final TestSessionRepository sessions;
    private final DrawingAnswerService drawingAnswers;
    private final Optional<ObjectStorageService> storage;
    private final ObjectMapper objectMapper;

    public TestSessionService(
            TestSessionRepository sessions,
            DrawingAnswerService drawingAnswers,
            @Autowired(required = false) ObjectStorageService storage,
            ObjectMapper objectMapper) {
        this.sessions = sessions;
        this.drawingAnswers = drawingAnswers;
        this.storage = Optional.ofNullable(storage);
        this.objectMapper = objectMapper;
    }

    @Transactional
    public TestSessionSummaryDto submit(SubmitTestSessionRequest request) {
        UUID sessionId = UUID.randomUUID();
        String rawJson = toJson(request.rawAnswers());
        String storedAnswers = drawingAnswers.offloadDrawings(sessionId, rawJson);
        Instant now = Instant.now();

        TestSessionEntity session = TestSessionEntity.createSubmitted(
                sessionId,
                request.patientId(),
                request.setId(),
                storedAnswers,
                now);
        sessions.save(session);

        return TestSessionSummaryDto.from(session);
    }

    public byte[] loadDrawing(UUID sessionId, String answerKey) {
        ObjectStorageService objectStorage = storage.orElseThrow(
                () -> new IllegalStateException("MinIO is disabled — cannot load drawings"));
        if (!DrawingAnswerKeys.CANVAS_KEYS.contains(answerKey)) {
            throw new IllegalArgumentException("Unknown drawing answer key: " + answerKey);
        }
        TestSessionEntity session = sessions.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        try {
            JsonNode root = objectMapper.readTree(session.getRawAnswers());
            JsonNode ref = root.get(answerKey);
            if (ref == null || !ref.isObject()) {
                throw new IllegalArgumentException("No drawing stored for key: " + answerKey);
            }
            String objectKey = ref.path("objectKey").asText(null);
            if (objectKey == null || objectKey.isBlank()) {
                throw new IllegalArgumentException("Drawing ref missing objectKey: " + answerKey);
            }
            return objectStorage.getObject(objectKey);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load drawing " + answerKey, e);
        }
    }

    private String toJson(Map<String, Object> rawAnswers) {
        try {
            return objectMapper.writeValueAsString(rawAnswers);
        } catch (Exception e) {
            throw new IllegalArgumentException("rawAnswers must be JSON-serializable", e);
        }
    }
}
