package com.moca.platform.Service.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.moca.platform.DataLayer.protocol.session.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.session.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionStatus;
import com.moca.platform.Dto.session.SubmitTestSessionRequest;
import com.moca.platform.ObjectDb.ObjectStorageService;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * TestSessionUseCaseImpl tests — Mockito replaces DB + drawing + storage.
 *
 * <p>Flow: mock repositories → call service → assert result or exception.
 */
@ExtendWith(MockitoExtension.class)
class TestSessionUseCaseImplTest {

    @Mock
    TestSessionRepository sessions;

    @Mock
    DrawingAnswerService drawingAnswers;

    @Mock
    ObjectStorageService storage;

    ObjectMapper objectMapper;
    TestSessionUseCaseImpl service;

    @Captor
    ArgumentCaptor<TestSessionEntity> sessionCaptor;

    UUID patientId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new TestSessionUseCaseImpl(sessions, drawingAnswers, storage, objectMapper);
        patientId = UUID.randomUUID();
    }

    @Nested
    class Submit {

        @Test
        void savesSessionAndReturnsDto() {
            var request = new SubmitTestSessionRequest(
                    patientId, "set-a", Map.of("q1", "cat", "q2", 42), 0);
            when(drawingAnswers.offloadDrawings(any(UUID.class), any(String.class)))
                    .thenAnswer(invocation -> invocation.getArgument(1));

            var result = service.submit(request);

            assertThat(result.setId()).isEqualTo("set-a");
            assertThat(result.status()).isEqualTo(TestSessionStatus.PENDING_REVIEW);
            verify(sessions).save(any(TestSessionEntity.class));
        }

        @Test
        void storesRawAnswersViaDrawingService() {
            var request = new SubmitTestSessionRequest(
                    patientId, "set-b", Map.of("ans", "hello"), 0);

            service.submit(request);

            verify(drawingAnswers).offloadDrawings(any(UUID.class), any(String.class));
        }
    }

    @Nested
    class LoadDrawing {

        /** Valid session + valid answer key → returns PNG bytes. */
        @Test
        void returnsBytes_whenSessionAndKeyValid() throws Exception {
            UUID sessionId = UUID.randomUUID();
            ObjectNode ref = objectMapper.createObjectNode();
            ref.put("storage", "minio");
            ref.put("objectKey", "sessions/" + sessionId + "/section_1a_trail_canvas.png");
            ObjectNode root = objectMapper.createObjectNode();
            root.set("section_1a_trail_canvas", ref);
            String rawAnswers = objectMapper.writeValueAsString(root);

            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    sessionId, patientId, "set-a", rawAnswers, Instant.now());
            when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
            when(storage.getObject("sessions/" + sessionId + "/section_1a_trail_canvas.png"))
                    .thenReturn(new byte[]{1, 2, 3});

            byte[] result = service.loadDrawing(sessionId, "section_1a_trail_canvas");

            assertThat(result).containsExactly(1, 2, 3);
        }

        /** Unknown session → throws. */
        @Test
        void throws_whenSessionNotFound() {
            UUID sessionId = UUID.randomUUID();
            when(sessions.findById(sessionId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.loadDrawing(sessionId, "section_1a_trail_canvas"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Session not found");
        }

        /** Invalid answer key → throws. */
        @Test
        void throws_whenInvalidAnswerKey() {
            assertThatThrownBy(() -> service.loadDrawing(UUID.randomUUID(), "invalid_key"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Unknown drawing answer key");
        }
    }
}
