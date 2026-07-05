package com.moca.platform.Dto.doctor;

import com.moca.platform.DataLayer.protocol.session.TestSessionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionDetailDto(
        UUID id,
        UUID patientId,
        String patientName,
        Instant submittedAt,
        String setId,
        TestSessionStatus status,
        BigDecimal provisionalScore,
        BigDecimal finalScore,
        String classification,
        BigDecimal educationBonus,
        List<SectionScoreDto> sectionScores) {
}
