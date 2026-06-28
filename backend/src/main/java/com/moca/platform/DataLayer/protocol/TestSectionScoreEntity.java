package com.moca.platform.DataLayer.protocol;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
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

    @Column(name = "max_points", nullable = false)
    private int maxPoints;

    @Column(nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "scoring_mode", nullable = false, columnDefinition = "scoring_mode")
    private ScoringMode scoringMode;

    @Column(name = "doctor_override")
    private Integer doctorOverride;

    protected TestSectionScoreEntity() {
    }

    public static TestSectionScoreEntity create(
            UUID id,
            UUID sessionId,
            String sectionKey,
            String label,
            int maxPoints,
            int points,
            ScoringMode scoringMode) {
        TestSectionScoreEntity row = new TestSectionScoreEntity();
        row.id = id;
        row.sessionId = sessionId;
        row.sectionKey = sectionKey;
        row.label = label;
        row.maxPoints = maxPoints;
        row.points = points;
        row.scoringMode = scoringMode;
        return row;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public String getSectionKey() {
        return sectionKey;
    }

    public String getLabel() {
        return label;
    }

    public int getMaxPoints() {
        return maxPoints;
    }

    public int getPoints() {
        return points;
    }

    public Integer getDoctorOverride() {
        return doctorOverride;
    }

    public void setDoctorOverride(Integer doctorOverride) {
        this.doctorOverride = doctorOverride;
    }
}
