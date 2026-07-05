package com.moca.platform.Service.patient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentEntity;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PatientAssignClinicianUseCaseImplTest {

    @Mock
    UserRepository users;

    @Mock
    PatientAssignmentRepository assignments;

    @InjectMocks
    PatientAssignClinicianUseCaseImpl service;

    UUID patientId;
    UUID doctorId;
    UUID previousDoctorId;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        doctorId = UUID.randomUUID();
        previousDoctorId = UUID.randomUUID();
        when(users.findById(patientId)).thenReturn(Optional.of(patient(patientId)));
        when(users.findById(doctorId)).thenReturn(Optional.of(doctor(doctorId)));
    }

    @Test
    void assignsNewClinician_andEndsPrevious() {
        var previous = assignment(patientId, previousDoctorId, true);
        when(assignments.findByPatientIdAndDoctorIdAndIsCurrentTrue(patientId, doctorId))
                .thenReturn(Optional.empty());
        when(assignments.findByPatientIdAndIsCurrentTrue(patientId)).thenReturn(List.of(previous));
        when(assignments.save(any(PatientAssignmentEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        service.assignClinician(patientId, doctorId);

        assertThat(previous.isCurrent()).isFalse();
        ArgumentCaptor<PatientAssignmentEntity> captor =
                ArgumentCaptor.forClass(PatientAssignmentEntity.class);
        verify(assignments, org.mockito.Mockito.times(2)).save(captor.capture());
        assertThat(captor.getAllValues().get(1).getDoctorId()).isEqualTo(doctorId);
        assertThat(captor.getAllValues().get(1).isCurrent()).isTrue();
    }

    @Test
    void noOp_whenAlreadyCurrent() {
        when(assignments.findByPatientIdAndDoctorIdAndIsCurrentTrue(patientId, doctorId))
                .thenReturn(Optional.of(assignment(patientId, doctorId, true)));

        service.assignClinician(patientId, doctorId);

        verify(assignments, never()).save(any());
    }

    @Test
    void throws404WhenDoctorMissing() {
        when(users.findById(doctorId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignClinician(patientId, doctorId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    private static UserEntity patient(UUID id) {
        return new UserEntity(
                id, null, "84901234567", UserRole.PATIENT, "BN",
                "hash", null, null, null, Instant.now(), Instant.now());
    }

    private static UserEntity doctor(UUID id) {
        return new UserEntity(
                id, "doc@moca.local", null, UserRole.DOCTOR, "BS",
                "hash", null, null, null, Instant.now(), Instant.now());
    }

    private static PatientAssignmentEntity assignment(UUID patientId, UUID doctorId, boolean current) {
        return new PatientAssignmentEntity(
                UUID.randomUUID(), patientId, doctorId, current, Instant.now());
    }
}
