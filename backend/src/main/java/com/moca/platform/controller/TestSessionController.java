package com.moca.platform.controller;

import com.moca.platform.dto.SubmitTestSessionRequest;
import com.moca.platform.dto.TestSessionSummaryDto;
import com.moca.platform.service.TestSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestSessionController {

    private final TestSessionService testSessionService;

    public TestSessionController(TestSessionService testSessionService) {
        this.testSessionService = testSessionService;
    }

    @PostMapping("/test-sessions")
    public TestSessionSummaryDto submit(@Valid @RequestBody SubmitTestSessionRequest request) {
        return testSessionService.submit(request);
    }

    @GetMapping("/test-sessions/{sessionId}/drawings/{answerKey}")
    public ResponseEntity<byte[]> drawing(
            @PathVariable java.util.UUID sessionId,
            @PathVariable String answerKey) {
        byte[] png = testSessionService.loadDrawing(sessionId, answerKey);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(png);
    }
}
