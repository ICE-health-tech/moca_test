package com.moca.platform.dto;
import com.moca.platform.DataLayer.protocol.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
import java.time.Instant;
import java.util.UUID;

public record TestSessionSummaryDto(
        UUID id,
        String setId,
        Instant submittedAt,
        TestSessionStatus status,
        Integer provisionalScore,
        Integer finalScore,
        String classification) {

    public static TestSessionSummaryDto from(TestSessionEntity session) {
        return new TestSessionSummaryDto(
                session.getId(),
                session.getSetId(),
                session.getSubmittedAt(),
                session.getStatus(),
                session.getAutoScore(),
                session.getFinalScore(),
                session.getClassification());
    }
}
