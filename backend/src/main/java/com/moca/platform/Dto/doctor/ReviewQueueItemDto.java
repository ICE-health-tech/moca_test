package com.moca.platform.Dto.doctor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReviewQueueItemDto(
        UUID id,
        String patientName,
        Instant submittedAt,
        BigDecimal provisionalScore,
        String setId) {
}
