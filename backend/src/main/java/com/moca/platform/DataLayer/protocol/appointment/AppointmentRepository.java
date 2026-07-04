package com.moca.platform.DataLayer.protocol.appointment;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, UUID> {

    @Query("""
            SELECT a FROM AppointmentEntity a
            WHERE a.patientId = :patientId
            ORDER BY a.scheduledAt DESC
            """)
    List<AppointmentEntity> findByPatientIdOrderByScheduledAtDesc(@Param("patientId") UUID patientId);
}
