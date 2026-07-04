package com.moca.platform.Service.patient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moca.platform.DataLayer.protocol.appointment.AppointmentEntity;
import com.moca.platform.DataLayer.protocol.appointment.AppointmentRepository;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileEntity;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileRepository;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.session.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * PatientApiUseCaseImpl tests — Mockito replaces all 5 repositories.
 *
 * <p>Flow: mock DB → call service → assert DTO or exception.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PatientApiUseCaseImplTest {

    @Mock
    TestSessionRepository sessions;

    @Mock
    AppointmentRepository appointments;

    @Mock
    UserRepository users;

    @Mock
    DoctorProfileRepository doctorProfiles;

    @Mock
    PatientAssignmentRepository assignments;

    @InjectMocks
    PatientApiUseCaseImpl service;

    UUID patientId;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
    }

    @Nested
    class ListSessions {

        @Test
        void returnsSessionsForPatient() {
            when(users.findById(patientId)).thenReturn(Optional.of(patient()));
            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    UUID.randomUUID(), patientId, "set-a", "{}", Instant.now());
            when(sessions.findByPatientIdOrderByCreatedAtDesc(patientId))
                    .thenReturn(List.of(session));

            var result = service.listSessions(patientId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).setId()).isEqualTo("set-a");
        }

        @Test
        void throws404_whenPatientNotFound() {
            when(users.findById(patientId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.listSessions(patientId))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting("statusCode")
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    class ListAppointments {

        @Test
        void returnsAppointmentsWithDoctorNames() throws Exception {
            UUID doctorId = UUID.randomUUID();
            when(users.findById(patientId)).thenReturn(Optional.of(patient()));
            AppointmentEntity apt = newAppointment(doctorId);
            when(appointments.findByPatientIdOrderByScheduledAtDesc(patientId))
                    .thenReturn(List.of(apt));
            var doctor = new UserEntity(doctorId, "doc@t.com", null, UserRole.DOCTOR,
                    "BS. A", "hash", null, null, null, Instant.now(), Instant.now());
            when(users.findAllById(anySet())).thenReturn(List.of(doctor));

            var result = service.listAppointments(patientId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).doctorName()).isEqualTo("BS. A");
        }

        @Test
        void returnsEmpty_whenNoAppointments() {
            when(users.findById(patientId)).thenReturn(Optional.of(patient()));
            when(appointments.findByPatientIdOrderByScheduledAtDesc(patientId))
                    .thenReturn(List.of());

            assertThat(service.listAppointments(patientId)).isEmpty();
        }
    }

    @Nested
    class ListDoctorOptions {

        @Test
        void returnsDoctorsWithSpecialty() {
            UUID docId = UUID.randomUUID();
            when(users.findById(patientId)).thenReturn(Optional.of(patient()));
            var doctor = new UserEntity(docId, "doc@t.com", null, UserRole.DOCTOR,
                    "BS. A", "hash", null, null, null, Instant.now(), Instant.now());
            when(users.findAllDoctors()).thenReturn(List.of(doctor));
            var profile = mockProfile(docId, "Thần kinh", true);
            when(doctorProfiles.findAllById(anySet())).thenReturn(List.of(profile));
            when(assignments.findByPatientIdAndIsCurrentTrue(patientId))
                    .thenReturn(List.of());

            var result = service.listDoctorOptions(patientId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).specialty()).isEqualTo("Thần kinh");
            assertThat(result.get(0).isCurrent()).isFalse();
        }
    }

    // ── fixtures ──

    private UserEntity patient() {
        return new UserEntity(patientId, null, "84901234567", UserRole.PATIENT,
                "Người bệnh", "hash", null, null, null, Instant.now(), Instant.now());
    }

    private AppointmentEntity newAppointment(UUID doctorId) {
        AppointmentEntity apt = mock(AppointmentEntity.class);
        org.mockito.Mockito.doReturn(UUID.randomUUID()).when(apt).getId();
        org.mockito.Mockito.doReturn(patientId).when(apt).getPatientId();
        org.mockito.Mockito.doReturn(doctorId).when(apt).getDoctorId();
        org.mockito.Mockito.doReturn(Instant.now()).when(apt).getScheduledAt();
        return apt;
    }

    private DoctorProfileEntity mockProfile(UUID userId, String specialty, boolean active) {
        DoctorProfileEntity p = org.mockito.Mockito.mock(DoctorProfileEntity.class);
        org.mockito.Mockito.doReturn(userId).when(p).getUserId();
        org.mockito.Mockito.doReturn(specialty).when(p).getSpecialty();
        org.mockito.Mockito.doReturn(active).when(p).isActive();
        return p;
    }
}
