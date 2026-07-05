package com.moca.platform.DataLayer.protocol.session;

import com.moca.platform.shared.Decimals;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "test_sessions", schema = "public")
public class TestSessionEntity {

    @Id
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id")
    private UUID doctorId;

    @Column(name = "set_id", nullable = false)
    private String setId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_answers", nullable = false, columnDefinition = "jsonb")
    private String rawAnswers;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "test_session_status")
    private TestSessionStatus status;

    @Column(name = "auto_score", precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal autoScore;

    @Column(name = "review_score", precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal reviewScore;

    @Column(name = "final_score", precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal finalScore;

    @Column(name = "education_bonus", precision = 10, scale = Decimals.SCORE_SCALE)
    private BigDecimal educationBonus;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "classification")
    private String classification;

    public static TestSessionEntity createSubmitted(
            UUID id,
            UUID patientId,
            String setId,
            String rawAnswers,
            int educationYears,
            Instant submittedAt) {
        TestSessionEntity session = new TestSessionEntity();
        session.id = id;
        session.patientId = patientId;
        session.setId = setId;
        session.rawAnswers = rawAnswers;
        session.status = TestSessionStatus.PENDING_REVIEW;
        session.educationBonus = Decimals.score(educationYears <= 12 ? 1 : 0);
        session.submittedAt = submittedAt;
        session.createdAt = submittedAt;
        session.classification = "Chờ bác sĩ duyệt";
        return session;
    }

    public void finalizeReview(BigDecimal finalScore, String classification, UUID reviewedBy, Instant reviewedAt) {
        BigDecimal normalized = Decimals.normalizeScore(finalScore);
        this.finalScore = normalized;
        this.reviewScore = normalized;
        this.classification = classification;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.status = TestSessionStatus.FINALIZED;
    }
}
