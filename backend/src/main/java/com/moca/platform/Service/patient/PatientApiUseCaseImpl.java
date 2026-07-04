package com.moca.platform.Service.patient;

import com.moca.platform.DataLayer.protocol.appointment.AppointmentEntity;
import com.moca.platform.DataLayer.protocol.appointment.AppointmentRepository;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentEntity;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.session.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.Dto.appointment.AppointmentDto;
import com.moca.platform.Dto.patient.DoctorOptionDto;
import com.moca.platform.Dto.session.TestSessionSummaryDto;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileEntity;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PatientApiUseCaseImpl implements PatientApiUseCase {

    private final TestSessionRepository sessions;
    private final AppointmentRepository appointments;
    private final UserRepository users;
    private final DoctorProfileRepository doctorProfiles;
    private final PatientAssignmentRepository assignments;

    public PatientApiUseCaseImpl(
            TestSessionRepository sessions,
            AppointmentRepository appointments,
            UserRepository users,
            DoctorProfileRepository doctorProfiles,
            PatientAssignmentRepository assignments) {
        this.sessions = sessions;
        this.appointments = appointments;
        this.users = users;
        this.doctorProfiles = doctorProfiles;
        this.assignments = assignments;
    }

    // 1 validate patient → 2 query → 3 map DTO
    @Override
    @Transactional(readOnly = true)
    public List<TestSessionSummaryDto> listSessions(UUID patientId) {
        requirePatient(patientId);
        return sessions.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(TestSessionSummaryDto::from)
                .toList();
    }

    // 1 validate → 2 appointments → 3 batch doctors → 4 map DTO (no DB in loop)
    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> listAppointments(UUID patientId) {
        requirePatient(patientId);
        List<AppointmentEntity> rows =
                appointments.findByPatientIdOrderByScheduledAtDesc(patientId);
        if (rows.isEmpty()) {
            return List.of();
        }

        Set<UUID> doctorIds = rows.stream()
                .map(AppointmentEntity::getDoctorId)
                .collect(Collectors.toSet());
        Map<UUID, UserEntity> doctorsById = users.findAllById(doctorIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        return rows.stream()
                .map(row -> toAppointmentDto(row, doctorsById))
                .toList();
    }

    // 1 validate → 2 doctors → 3 batch profiles + assignments → 4 map DTO (no DB in loop)
    @Override
    @Transactional(readOnly = true)
    public List<DoctorOptionDto> listDoctorOptions(UUID patientId) {
        requirePatient(patientId);
        List<UserEntity> doctors = users.findAllDoctors();
        if (doctors.isEmpty()) {
            return List.of();
        }

        Set<UUID> doctorIds = doctors.stream()
                .map(UserEntity::getId)
                .collect(Collectors.toSet());
        Map<UUID, DoctorProfileEntity> profilesById = doctorProfiles.findAllById(doctorIds).stream()
                .collect(Collectors.toMap(DoctorProfileEntity::getUserId, p -> p));
        Set<UUID> currentDoctorIds = assignments.findByPatientIdAndIsCurrentTrue(patientId).stream()
                .map(PatientAssignmentEntity::getDoctorId)
                .collect(Collectors.toSet());

        return doctors.stream()
                .map(d -> toDoctorOption(d, profilesById, currentDoctorIds))
                .toList();
    }

    private void requirePatient(UUID patientId) {
        UserEntity user = users.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bệnh nhân"));
        if (user.getRole() != UserRole.PATIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng không phải bệnh nhân");
        }
    }

    private AppointmentDto toAppointmentDto(AppointmentEntity row, Map<UUID, UserEntity> doctorsById) {
        String doctorName = Optional.ofNullable(doctorsById.get(row.getDoctorId()))
                .map(UserEntity::getFullName)
                .orElse("Bác sĩ");
        return new AppointmentDto(row.getId(), doctorName, row.getScheduledAt(), row.getStatus());
    }

    private DoctorOptionDto toDoctorOption(
            UserEntity doctor,
            Map<UUID, DoctorProfileEntity> profilesById,
            Set<UUID> currentDoctorIds) {
        DoctorProfileEntity profile = profilesById.get(doctor.getId());
        String specialty = profile != null && profile.getSpecialty() != null
                ? profile.getSpecialty()
                : "";
        boolean isCurrent = currentDoctorIds.contains(doctor.getId());
        return new DoctorOptionDto(
                doctor.getId(),
                doctor.getFullName(),
                specialty,
                doctor.getPhoneNumber(),
                doctor.getEmail(),
                null,
                null,
                isCurrent);
    }
}
