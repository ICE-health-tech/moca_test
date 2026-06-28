package com.moca.platform.dto;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
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
        Integer provisionalScore,
        Integer finalScore,
        String classification,
        List<SectionScoreDto> sectionScores) {
}
