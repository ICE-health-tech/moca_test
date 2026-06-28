package com.moca.platform.dto;
import java.time.Instant;
import java.util.UUID;

public record ReviewQueueItemDto(
        UUID id,
        String patientName,
        Instant submittedAt,
        Integer provisionalScore,
        String setId) {
}
