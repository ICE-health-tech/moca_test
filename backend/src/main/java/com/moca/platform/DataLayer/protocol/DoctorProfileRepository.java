package com.moca.platform.DataLayer.protocol;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorProfileRepository extends JpaRepository<DoctorProfileEntity, UUID> {

    @Query("""
            SELECT pa.doctorId, COUNT(pa) FROM PatientAssignmentEntity pa
            WHERE pa.isCurrent = true
            GROUP BY pa.doctorId
            """)
    List<Object[]> countCurrentPatientsGrouped();

    Optional<DoctorProfileEntity> findByUserId(UUID userId);

    List<DoctorProfileEntity> findAllByOrderByUserIdAsc();
}
