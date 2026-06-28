package com.moca.platform.dto;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
import java.time.Instant;
import java.util.UUID;

public record DoctorPatientSessionDto(
        UUID id,
        Instant submittedAt,
        Integer score,
        int maxScore,
        TestSessionStatus status,
        String classification) {
}
