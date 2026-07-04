package com.moca.platform.DataLayer.protocol.session;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TestSessionRepository extends JpaRepository<TestSessionEntity, UUID> {

    List<TestSessionEntity> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    List<TestSessionEntity> findByDoctorIdAndStatusOrderBySubmittedAtAsc(
            UUID doctorId, TestSessionStatus status);

    List<TestSessionEntity> findByPatientIdInOrderBySubmittedAtDesc(List<UUID> patientIds);

    List<TestSessionEntity> findByStatusOrderBySubmittedAtAsc(TestSessionStatus status);

    @Query("""
            SELECT ts FROM TestSessionEntity ts
            WHERE ts.status = :status
            AND ts.patientId IN (
                SELECT pa.patientId FROM PatientAssignmentEntity pa
                WHERE pa.doctorId = :doctorId AND pa.isCurrent = true
            )
            ORDER BY ts.submittedAt ASC
            """)
    List<TestSessionEntity> findPendingForDoctor(
            @Param("doctorId") UUID doctorId,
            @Param("status") TestSessionStatus status);

    @Query("""
            SELECT COUNT(ts) FROM TestSessionEntity ts
            WHERE ts.status = :status
            """)
    long countByStatus(@Param("status") TestSessionStatus status);

    @Query("""
            SELECT COUNT(ts) FROM TestSessionEntity ts
            WHERE ts.submittedAt >= :since
            """)
    long countSubmittedSince(@Param("since") java.time.Instant since);
}
