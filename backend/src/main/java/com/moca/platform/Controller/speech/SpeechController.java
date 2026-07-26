package com.moca.platform.Controller.speech;

import com.moca.platform.Dto.speech.SpeechStatusResponse;
import com.moca.platform.Dto.speech.TranscribeRequest;
import com.moca.platform.Dto.speech.TranscribeResponse;
import com.moca.platform.Service.speech.SpeechTranscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/speech")
public class SpeechController {

    private final SpeechTranscriptionService speech;

    public SpeechController(SpeechTranscriptionService speech) {
        this.speech = speech;
    }

    @GetMapping("/status")
    public SpeechStatusResponse status() {
        return new SpeechStatusResponse(
                speech.isAvailable(),
                speech.provider(),
                speech.isAvailable() ? "vi" : null);
    }

    /**
     * Transcribe patient audio with server-side Whisper (Vietnamese).
     * Frontend falls back to browser Web Speech when this returns unavailable / error.
     */
    @PostMapping("/transcribe")
    public ResponseEntity<TranscribeResponse> transcribe(@Valid @RequestBody TranscribeRequest request) {
        if (!speech.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(TranscribeResponse.unavailable(
                            "Speech AI is disabled. Set SPEECH_ENABLED=true and SPEECH_API_KEY."));
        }
        try {
            SpeechTranscriptionService.TranscriptionResult result = speech.transcribe(
                    request.audioBase64(),
                    request.contentType(),
                    request.filename(),
                    request.expectedSentence());
            return ResponseEntity.ok(TranscribeResponse.ok(
                    result.transcript(),
                    result.provider(),
                    result.language(),
                    result.score(),
                    result.matchRatio()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(TranscribeResponse.unavailable(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(TranscribeResponse.unavailable(e.getMessage()));
        }
    }
}
