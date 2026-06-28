package com.moca.platform.DataLayer.protocol;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
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

    @Column(name = "auto_score")
    private Integer autoScore;

    @Column(name = "review_score")
    private Integer reviewScore;

    @Column(name = "final_score")
    private Integer finalScore;

    @Column(name = "education_bonus")
    private Integer educationBonus;

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

    protected TestSessionEntity() {
    }

    public static TestSessionEntity createSubmitted(
            UUID id,
            UUID patientId,
            String setId,
            String rawAnswers,
            Instant submittedAt) {
        TestSessionEntity session = new TestSessionEntity();
        session.id = id;
        session.patientId = patientId;
        session.setId = setId;
        session.rawAnswers = rawAnswers;
        session.status = TestSessionStatus.PENDING_REVIEW;
        session.submittedAt = submittedAt;
        session.createdAt = submittedAt;
        session.classification = "Chờ bác sĩ duyệt";
        return session;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPatientId() {
        return patientId;
    }

    public TestSessionStatus getStatus() {
        return status;
    }

    public String getSetId() {
        return setId;
    }

    public String getRawAnswers() {
        return rawAnswers;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Integer getAutoScore() {
        return autoScore;
    }

    public Integer getFinalScore() {
        return finalScore;
    }

    public String getClassification() {
        return classification;
    }

    public UUID getDoctorId() {
        return doctorId;
    }

    public Integer getReviewScore() {
        return reviewScore;
    }

    /** 3 approve — set final score and mark reviewed */
    public void finalizeReview(int finalScore, String classification, UUID reviewedBy, Instant reviewedAt) {
        this.finalScore = finalScore;
        this.reviewScore = finalScore;
        this.classification = classification;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.status = TestSessionStatus.FINALIZED;
    }
}
