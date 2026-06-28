package com.moca.platform.DataLayer.protocol;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_assignments", schema = "public")
public class PatientAssignmentEntity {

    @Id
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @Column(name = "is_current", nullable = false)
    private boolean isCurrent;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    protected PatientAssignmentEntity() {
    }

    public UUID getPatientId() {
        return patientId;
    }

    public UUID getDoctorId() {
        return doctorId;
    }

    public boolean isCurrent() {
        return isCurrent;
    }
}
