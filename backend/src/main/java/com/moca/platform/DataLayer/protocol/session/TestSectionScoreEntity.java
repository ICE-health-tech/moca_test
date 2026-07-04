package com.moca.platform.DataLayer.protocol.session;

import com.moca.platform.shared.Decimals;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "test_section_scores", schema = "public")
public class TestSectionScoreEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "section_key", nullable = false)
    private String sectionKey;

    @Column(nullable = false)
    private String label;

    @Column(name = "max_points", nullable = false, precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal maxPoints;

    @Column(nullable = false, precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal points;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "scoring_mode", nullable = false, columnDefinition = "scoring_mode")
    private ScoringMode scoringMode;

    @Column(name = "doctor_override", precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal doctorOverride;

    public static TestSectionScoreEntity create(
            UUID id,
            UUID sessionId,
            String sectionKey,
            String label,
            BigDecimal maxPoints,
            BigDecimal points,
            ScoringMode scoringMode) {
        TestSectionScoreEntity row = new TestSectionScoreEntity();
        row.id = id;
        row.sessionId = sessionId;
        row.sectionKey = sectionKey;
        row.label = label;
        row.maxPoints = Decimals.normalizeScore(maxPoints);
        row.points = Decimals.normalizeScore(points);
        row.scoringMode = scoringMode;
        return row;
    }

    public void setDoctorOverride(BigDecimal doctorOverride) {
        this.doctorOverride = Decimals.normalizeScore(doctorOverride);
    }
}
