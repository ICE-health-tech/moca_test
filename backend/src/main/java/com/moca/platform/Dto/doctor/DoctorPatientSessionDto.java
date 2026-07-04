package com.moca.platform.Dto.doctor;

import com.moca.platform.DataLayer.protocol.session.TestSessionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DoctorPatientSessionDto(
        UUID id,
        Instant submittedAt,
        BigDecimal score,
        BigDecimal maxScore,
        TestSessionStatus status,
        String classification) {
}
