package com.moca.platform.Service.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moca.platform.ObjectDb.ObjectStorageService;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * DrawingAnswerService tests — pure Mockito, no Spring context.
 *
 * <p>Flow: mock ObjectStorageService → call offloadDrawings → assert JSON or exception.
 */
@ExtendWith(MockitoExtension.class)
class DrawingAnswerServiceTest {

    @Mock
    ObjectStorageService storage;

    ObjectMapper objectMapper;
    DrawingAnswerService service;

    UUID sessionId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new DrawingAnswerService(storage, objectMapper);
        sessionId = UUID.randomUUID();
    }

    @Nested
    class OffloadDrawings {

        /** Base64 PNG → upload to MinIO → replace data URL with object ref. */
        @Test
        void uploadsPngAndReplacesWithRef() throws Exception {
            byte[] png = {1, 2, 3};
            String b64 = Base64.getEncoder().encodeToString(png);
            String inputJson = """
                    {"section_1a_trail_canvas":"data:image/png;base64,%s"}""".formatted(b64);

            String result = service.offloadDrawings(sessionId, inputJson);

            verify(storage).putPng(anyString(), any(byte[].class));
            assertThat(result).doesNotContain("data:image/png");
            assertThat(result).contains("minio", "objectKey");
        }

        /** MinIO disabled → data URLs kept inline. */
        @Test
        void keepsInline_whenStorageDisabled() throws Exception {
            service = new DrawingAnswerService(null, objectMapper);
            String inputJson = """
                    {"section_1a_trail_canvas":"data:image/png;base64,AAAA"}""";

            String result = service.offloadDrawings(sessionId, inputJson);

            assertThat(result).contains("data:image/png");
        }

        /** Non-drawing keys (not in CANVAS_KEYS) are left unchanged. */
        @Test
        void ignoresNonCanvasKeys() throws Exception {
            String inputJson = """
                    {"section_2_naming":"cat","section_1a_trail_canvas":"data:image/png;base64,AAAA"}""";

            String result = service.offloadDrawings(sessionId, inputJson);

            assertThat(result).contains("cat");
        }

        /** Invalid JSON → throws. */
        @Test
        void throws_whenInvalidJson() {
            assertThatThrownBy(() -> service.offloadDrawings(sessionId, "not-json"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid raw_answers JSON");
        }

        /** Non-object JSON passes through unchanged. */
        @Test
        void passesThrough_whenNotJsonObject() throws Exception {
            String result = service.offloadDrawings(sessionId, "\"just a string\"");

            assertThat(result).isEqualTo("\"just a string\"");
            verify(storage, never()).putPng(anyString(), any(byte[].class));
        }
    }
}
