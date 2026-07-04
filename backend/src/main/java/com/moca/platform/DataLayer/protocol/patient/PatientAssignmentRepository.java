package com.moca.platform.DataLayer.protocol.patient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientAssignmentRepository extends JpaRepository<PatientAssignmentEntity, UUID> {

    @Query("""
            SELECT pa.patientId FROM PatientAssignmentEntity pa
            WHERE pa.doctorId = :doctorId AND pa.isCurrent = true
            """)
    List<UUID> findCurrentPatientIdsByDoctorId(@Param("doctorId") UUID doctorId);

    Optional<PatientAssignmentEntity> findByPatientIdAndDoctorIdAndIsCurrentTrue(
            UUID patientId, UUID doctorId);

    List<PatientAssignmentEntity> findByPatientIdAndIsCurrentTrue(UUID patientId);
}
