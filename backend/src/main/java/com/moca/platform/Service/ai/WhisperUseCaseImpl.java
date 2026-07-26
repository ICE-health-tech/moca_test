package com.moca.platform.Service.ai;

import com.moca.platform.AiLayer.WhisperClient;
import com.moca.platform.AiLayer.WhisperProperties;
import com.moca.platform.AiLayer.WhisperTranscript;
import com.moca.platform.Dto.ai.WhisperStatusDto;
import com.moca.platform.Dto.ai.WhisperTranscribeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Whisper ASR use case for MoCA section 5 assist.
 * Thin controller → this service → {@link WhisperClient}.
 */
@Service
public class WhisperUseCaseImpl implements WhisperUseCase {

    private final WhisperProperties props;
    private final WhisperClient client;

    public WhisperUseCaseImpl(WhisperProperties props, WhisperClient client) {
        this.props = props;
        this.client = client;
    }

    @Override
    public WhisperStatusDto status() {
        return new WhisperStatusDto(
                props.isEnabled(),
                props.getProvider(),
                props.getModel(),
                props.getLanguage(),
                props.getBaseUrl());
    }

    @Override
    public WhisperTranscribeResponse transcribe(MultipartFile file) {
        if (!props.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Whisper đang tắt — set WHISPER_ENABLED=true trong backend/.env");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu file âm thanh");
        }

        try {
            byte[] audio = file.getBytes();
            WhisperTranscript result =
                    client.transcribe(audio, file.getOriginalFilename(), file.getContentType());
            return new WhisperTranscribeResponse(
                    result.text(), result.language(), result.provider(), result.model());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Không đọc được file âm thanh: " + e.getMessage(), e);
        }
    }
}
