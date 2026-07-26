package com.moca.platform.Controller.ai;

import com.moca.platform.Dto.ai.WhisperStatusDto;
import com.moca.platform.Dto.ai.WhisperTranscribeResponse;
import com.moca.platform.Service.ai.WhisperUseCase;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Whisper ASR API — section 5 AI assist (yellow).
 *
 * <pre>
 * GET  /api/ai/whisper/status
 * POST /api/ai/whisper/transcribe  multipart field {@code file}
 * </pre>
 */
@RestController
@RequestMapping("/api/ai/whisper")
public class WhisperController {

    private final WhisperUseCase whisper;

    public WhisperController(WhisperUseCase whisper) {
        this.whisper = whisper;
    }

    @GetMapping("/status")
    public WhisperStatusDto status() {
        return whisper.status();
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public WhisperTranscribeResponse transcribe(@RequestParam("file") MultipartFile file) {
        return whisper.transcribe(file);
    }
}
