package com.moca.platform.Service.patient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.Dto.auth.AuthUserDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Use case layer test — Mockito replaces real DB (UserRepository).
 * Flow: mock findById → call service → assert result + verify save().
 */
@ExtendWith(MockitoExtension.class)
class PatientUpdateUseCaseImplTest {

    @Mock
    UserRepository users;

    @InjectMocks
    PatientUpdateUseCaseImpl service;

    UUID patientId;
    UserEntity patient;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        Instant now = Instant.now();
        patient = new UserEntity(
                patientId,
                null,
                "84901234567",
                UserRole.PATIENT,
                "Người bệnh",
                "hash",
                null,
                null,
                null,
                now,
                now);
    }

    @Test
    void updateInformation_updatesPatientAndReturnsDto() {
        when(users.findById(patientId)).thenReturn(Optional.of(patient));
        when(users.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthUserDto result = service.updateInformation(
                patientId,
                "Trần Văn A",
                "a@test.com",
                "male",
                LocalDate.of(1950, 1, 1),
                12);

        assertThat(result.fullName()).isEqualTo("Trần Văn A");
        assertThat(result.email()).isEqualTo("a@test.com");
        assertThat(result.educationYears()).isEqualTo(12);
        verify(users).save(patient);
    }

    @Test
    void updateInformation_throws404WhenUserMissing() {
        when(users.findById(patientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateInformation(
                        patientId, "Name", null, null, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateInformation_throws403WhenNotPatient() {
        Instant now = Instant.now();
        UserEntity doctor = new UserEntity(
                patientId,
                "doc@test.com",
                null,
                UserRole.DOCTOR,
                "Bác sĩ",
                "hash",
                null,
                null,
                null,
                now,
                now);
        when(users.findById(patientId)).thenReturn(Optional.of(doctor));

        assertThatThrownBy(() -> service.updateInformation(
                        patientId, "Name", null, null, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.FORBIDDEN);
    
    }
}
