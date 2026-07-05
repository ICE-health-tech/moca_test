package com.moca.platform.Service.session;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moca.platform.DataLayer.protocol.session.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.session.TestSessionRepository;
import com.moca.platform.shared.Decimals;
import com.moca.platform.DataLayer.protocol.session.TestSectionScoreRepository;
import com.moca.platform.Dto.session.TestSessionSummaryDto;
import com.moca.platform.Dto.session.SubmitTestSessionRequest;
import com.moca.platform.ObjectDb.ObjectStorageService;
import com.moca.platform.ObjectDb.DrawingAnswerKeys;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestSessionUseCaseImpl implements TestSessionUseCase {

    private final TestSessionRepository sessions;
    private final TestSectionScoreRepository sectionScores;
    private final DrawingAnswerService drawingAnswers;
    private final MocaAutoGrader grader;
    private final Optional<ObjectStorageService> storage;
    private final ObjectMapper objectMapper;

    public TestSessionUseCaseImpl(
            TestSessionRepository sessions,
            TestSectionScoreRepository sectionScores,
            DrawingAnswerService drawingAnswers,
            MocaAutoGrader grader,
            @Autowired(required = false) ObjectStorageService storage,
            ObjectMapper objectMapper) {
        this.sessions = sessions;
        this.sectionScores = sectionScores;
        this.drawingAnswers = drawingAnswers;
        this.grader = grader;
        this.storage = Optional.ofNullable(storage);
        this.objectMapper = objectMapper;
    }

    @Override
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
                request.educationYears(),
                now);

        MocaAutoGrader.GradeResult graded = grader.grade(request.rawAnswers(), request.educationYears());
        session.applyProvisionalGrade(
                Decimals.score(graded.provisional()),
                graded.classification());

        sessions.save(session);
        sectionScores.saveAll(grader.toEntities(sessionId, graded));

        return TestSessionSummaryDto.from(session);
    }

    @Override
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
