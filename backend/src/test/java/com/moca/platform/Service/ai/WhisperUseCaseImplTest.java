package com.moca.platform.Service.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moca.platform.AiLayer.WhisperClient;
import com.moca.platform.AiLayer.WhisperProperties;
import com.moca.platform.AiLayer.WhisperTranscript;
import com.moca.platform.Dto.ai.WhisperTranscribeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WhisperUseCaseImplTest {

    @Mock
    WhisperClient client;

    WhisperProperties props;
    WhisperUseCaseImpl useCase;

    @BeforeEach
    void setUp() {
        props = new WhisperProperties();
        props.setEnabled(true);
        props.setProvider("openai");
        props.setModel("whisper-1");
        props.setLanguage("vi");
        props.setBaseUrl("https://api.openai.com/v1");
        useCase = new WhisperUseCaseImpl(props, client);
    }

    @Test
    void status_exposesConfigWithoutSecrets() {
        props.setApiKey("sk-secret");
        var status = useCase.status();
        assertThat(status.enabled()).isTrue();
        assertThat(status.provider()).isEqualTo("openai");
        assertThat(status.model()).isEqualTo("whisper-1");
        assertThat(status.language()).isEqualTo("vi");
        assertThat(status.baseUrl()).contains("openai.com");
    }

    @Test
    void transcribe_returnsTranscript_whenEnabled() {
        MockMultipartFile file =
                new MockMultipartFile("file", "a.webm", "audio/webm", new byte[] {1, 2, 3});
        when(client.transcribe(any(), eq("a.webm"), eq("audio/webm")))
                .thenReturn(new WhisperTranscript("xin chào", "vi", "openai", "whisper-1"));

        WhisperTranscribeResponse response = useCase.transcribe(file);

        assertThat(response.transcript()).isEqualTo("xin chào");
        assertThat(response.provider()).isEqualTo("openai");
        verify(client).transcribe(any(), eq("a.webm"), eq("audio/webm"));
    }

    @Test
    void transcribe_rejects_whenDisabled() {
        props.setEnabled(false);
        MockMultipartFile file =
                new MockMultipartFile("file", "a.webm", "audio/webm", new byte[] {1});

        assertThatThrownBy(() -> useCase.transcribe(file))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verify(client, never()).transcribe(any(), anyString(), anyString());
    }

    @Test
    void transcribe_rejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile("file", "a.webm", "audio/webm", new byte[0]);

        assertThatThrownBy(() -> useCase.transcribe(file))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(client, never()).transcribe(any(), anyString(), anyString());
    }
}
