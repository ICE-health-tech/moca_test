package com.moca.platform.Service.speech;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moca.platform.SpeechLayer.SpeechProperties;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SpeechTranscriptionServiceTest {

    SpeechProperties props;
    SpeechTranscriptionService service;

    @BeforeEach
    void setUp() {
        props = new SpeechProperties();
        props.setEnabled(false);
        service = new SpeechTranscriptionService(
                props, null, new ObjectMapper(), new SentenceRepetitionScorer());
    }

    @Test
    void unavailable_whenDisabled() {
        assertThat(service.isAvailable()).isFalse();
        assertThat(service.provider()).isEqualTo("none");
    }

    @Test
    void decodeAudio_acceptsDataUrl() {
        byte[] bytes = {1, 2, 3, 4};
        String dataUrl = "data:audio/webm;base64," + Base64.getEncoder().encodeToString(bytes);

        var decoded = SpeechTranscriptionService.decodeAudio(dataUrl, null, null);

        assertThat(decoded.bytes()).containsExactly(1, 2, 3, 4);
        assertThat(decoded.contentType()).isEqualTo("audio/webm");
        assertThat(decoded.filename()).isEqualTo("recording.webm");
    }

    @Test
    void decodeAudio_rejectsEmpty() {
        assertThatThrownBy(() -> SpeechTranscriptionService.decodeAudio("", "audio/webm", "a.webm"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void transcribe_throws_whenUnavailable() {
        assertThatThrownBy(() -> service.transcribe("AAAA", "audio/webm", "a.webm", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disabled");
    }
}
