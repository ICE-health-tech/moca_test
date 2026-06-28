package com.moca.platform.service;

import com.moca.platform.DataLayer.protocol.DoctorProfileEntity;
import com.moca.platform.dto.AdminDoctorDto;
import com.moca.platform.dto.AdminStatsDto;
import com.moca.platform.DataLayer.protocol.DoctorProfileRepository;
import com.moca.platform.DataLayer.protocol.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
import com.moca.platform.DataLayer.protocol.UserEntity;
import com.moca.platform.DataLayer.protocol.UserRepository;
import com.moca.platform.DataLayer.protocol.UserRole;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminApiService {

    private final UserRepository users;
    private final DoctorProfileRepository doctorProfiles;
    private final TestSessionRepository sessions;

    public AdminApiService(
            UserRepository users,
            DoctorProfileRepository doctorProfiles,
            TestSessionRepository sessions) {
        this.users = users;
        this.doctorProfiles = doctorProfiles;
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public AdminStatsDto stats() {
        Instant monthStart = YearMonth.now(ZoneOffset.UTC).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        return new AdminStatsDto(
                users.countByRole(UserRole.DOCTOR),
                users.countByRole(UserRole.PATIENT),
                sessions.countByStatus(TestSessionStatus.PENDING_REVIEW),
                sessions.countSubmittedSince(monthStart));
    }

    // 1 doctors → 2 batch profiles + patient counts → 3 map DTO (no DB in loop)
    @Transactional(readOnly = true)
    public List<AdminDoctorDto> listDoctors() {
        List<UserEntity> doctors = users.findAllDoctors();
        if (doctors.isEmpty()) {
            return List.of();
        }

        Set<UUID> doctorIds = doctors.stream()
                .map(UserEntity::getId)
                .collect(Collectors.toSet());
        Map<UUID, DoctorProfileEntity> profilesById = doctorProfiles.findAllById(doctorIds).stream()
                .collect(Collectors.toMap(DoctorProfileEntity::getUserId, p -> p));
        Map<UUID, Long> patientCountByDoctorId = loadPatientCountByDoctorId();

        return doctors.stream()
                .map(doctor -> toAdminDoctor(doctor, profilesById, patientCountByDoctorId))
                .toList();
    }

    private Map<UUID, Long> loadPatientCountByDoctorId() {
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : doctorProfiles.countCurrentPatientsGrouped()) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return counts;
    }

    private AdminDoctorDto toAdminDoctor(
            UserEntity doctor,
            Map<UUID, DoctorProfileEntity> profilesById,
            Map<UUID, Long> patientCountByDoctorId) {
        DoctorProfileEntity profile = profilesById.get(doctor.getId());
        String specialty = profile != null && profile.getSpecialty() != null
                ? profile.getSpecialty()
                : "";
        boolean active = profile == null || profile.isActive();
        long patientCount = patientCountByDoctorId.getOrDefault(doctor.getId(), 0L);
        return new AdminDoctorDto(doctor.getId(), doctor.getFullName(), specialty, patientCount, active);
    }
}
