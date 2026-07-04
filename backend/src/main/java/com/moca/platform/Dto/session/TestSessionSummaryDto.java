package com.moca.platform.Dto.session;

import com.moca.platform.DataLayer.protocol.session.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.session.TestSessionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TestSessionSummaryDto(
        UUID id,
        String setId,
        Instant submittedAt,
        TestSessionStatus status,
        BigDecimal provisionalScore,
        BigDecimal finalScore,
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
