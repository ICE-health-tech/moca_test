package com.moca.platform.DataLayer.protocol.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "patient_assignments", schema = "public")
public class PatientAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @Column(name = "is_current", nullable = false)
    private boolean isCurrent;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    public PatientAssignmentEntity(
            UUID id,
            UUID patientId,
            UUID doctorId,
            boolean isCurrent,
            Instant assignedAt) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.isCurrent = isCurrent;
        this.assignedAt = assignedAt;
    }

    public static PatientAssignmentEntity assign(UUID patientId, UUID doctorId) {
        return new PatientAssignmentEntity(null, patientId, doctorId, true, Instant.now());
    }

    public void endAssignment() {
        this.isCurrent = false;
    }
}
