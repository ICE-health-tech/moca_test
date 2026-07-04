package com.moca.platform.Service.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.SecurityLayer.JwtService;
import java.time.Instant;
import java.util.Optional;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

/**
 * AuthUseCaseImpl tests — static helpers need no Spring context.
 * Mockito replaces real DB (UserRepository) and PasswordEncoder.
 * Flow: mock find/save → call service → assert result or exception.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthUseCaseImplTest {

    @Mock
    UserRepository users;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtService jwt;

    @InjectMocks
    AuthUseCaseImpl service;

    // ───────────────────── Shared fixture ─────────────────────
    UUID patientId;
    UserEntity patient;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        Instant now = Instant.now();
        patient = new UserEntity(
                patientId, null, "84901234567", UserRole.PATIENT, "Người bệnh",
                "hash", null, null, null, now, now);
        when(jwt.generate(any())).thenReturn("mock-token");
    }

    // ───────────────────── patientLogin ─────────────────────
    @Nested
    class PatientLogin {

        /** New phone → auto-create patient → return token. */
        @Test
        void createsNewPatient_whenPhoneNotFound() {
            when(users.findByPhoneNumber("84901234567")).thenReturn(Optional.empty());
            when(users.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            var response = service.patientLogin("0901234567");

            assertThat(response.user().role()).isEqualTo(UserRole.PATIENT);
            verify(users).save(any(UserEntity.class));
        }

        /** Existing phone → return token without saving. */
        @Test
        void returnsExistingPatient_whenPhoneFound() {
            when(users.findByPhoneNumber("84901234567")).thenReturn(Optional.of(patient));

            var response = service.patientLogin("0901234567");

            assertThat(response.user().role()).isEqualTo(UserRole.PATIENT);
        }

        /** Phone belongs to a DOCTOR → 401. */
        @Test
        void throws401_whenPhoneBelongsToDoctor() {
            var doctor = new UserEntity(
                    UUID.randomUUID(), "doc@test.com", "84901234567",
                    UserRole.DOCTOR, "Bác sĩ", "hash", null, null, null,
                    Instant.now(), Instant.now());
            when(users.findByPhoneNumber("84901234567")).thenReturn(Optional.of(doctor));

            assertThatThrownBy(() -> service.patientLogin("0901234567"))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting("statusCode")
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    // ───────────────────── doctorLogin ─────────────────────
    @Nested
    class DoctorLogin {

        /** Correct email + password → return token. */
        @Test
        void returnsToken_whenCredentialsValid() {
            var doctor = new UserEntity(
                    UUID.randomUUID(), "doc@test.com", null,
                    UserRole.DOCTOR, "Bác sĩ", "encoded-pass", null, null, null,
                    Instant.now(), Instant.now());
            when(users.findByEmailIgnoreCase("doc@test.com")).thenReturn(Optional.of(doctor));
            when(passwordEncoder.matches("correct-pass", "encoded-pass")).thenReturn(true);

            var response = service.doctorLogin("doc@test.com", "correct-pass");

            assertThat(response.user().role()).isEqualTo(UserRole.DOCTOR);
        }

        /** Unknown email → 401. */
        @Test
        void throws401_whenEmailNotFound() {
            when(users.findByEmailIgnoreCase("unknown@test.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.doctorLogin("unknown@test.com", "pass"))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting("statusCode")
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        /** Wrong password → 401. */
        @Test
        void throws401_whenPasswordWrong() {
            var doctor = new UserEntity(
                    UUID.randomUUID(), "doc@test.com", null,
                    UserRole.DOCTOR, "Bác sĩ", "encoded-pass", null, null, null,
                    Instant.now(), Instant.now());
            when(users.findByEmailIgnoreCase("doc@test.com")).thenReturn(Optional.of(doctor));
            when(passwordEncoder.matches("wrong-pass", "encoded-pass")).thenReturn(false);

            assertThatThrownBy(() -> service.doctorLogin("doc@test.com", "wrong-pass"))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting("statusCode")
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        /** User is PATIENT (not DOCTOR/ADMIN) → 401. */
        @Test
        void throws401_whenRoleNotDoctorOrAdmin() {
            when(users.findByEmailIgnoreCase("patient@test.com")).thenReturn(Optional.of(patient));
            when(passwordEncoder.matches("pass", "hash")).thenReturn(true);

            assertThatThrownBy(() -> service.doctorLogin("patient@test.com", "pass"))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting("statusCode")
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    // ───────────────────── normalizePhone(String) ─────────────────────
    @Nested
    class NormalizePhone {

        // --- existing happy-path tests (kept for backward compat) ---
        @Test
        void convertsLeadingZeroTo84() {
            assertThat(AuthUseCaseImpl.normalizePhone("0901234567")).isEqualTo("84901234567");
        }

        @Test
        void stripsNonDigits() {
            assertThat(AuthUseCaseImpl.normalizePhone("+84 901-234-567")).isEqualTo("84901234567");
        }

        @Test
        void keeps84Prefix() {
            assertThat(AuthUseCaseImpl.normalizePhone("84901234567")).isEqualTo("84901234567");
        }

        // --- edge cases ---
        @Test
        void returnsEmpty_whenInputEmpty() {
            assertThat(AuthUseCaseImpl.normalizePhone("")).isEmpty();
        }

        @Test
        void returnsEmpty_whenInputBlank() {
            assertThat(AuthUseCaseImpl.normalizePhone("   ")).isEmpty();
        }

        @Test
        void returnsEmpty_whenNoDigits() {
            assertThat(AuthUseCaseImpl.normalizePhone("abc!@#")).isEmpty();
        }
    }

    // ───────────────────── normalizePhone(String, Boolean) ─────────────────────
    @Nested
    class NormalizePhoneWithFlag {

        @Test
        void stripsPlus_whenGeneralTrue() {
            assertThat(AuthUseCaseImpl.normalizePhone("+981234567", true)).isEqualTo("981234567");
        }

        @Test
        void leavesUnchanged_whenNoPlusAndGeneralTrue() {
            assertThat(AuthUseCaseImpl.normalizePhone("0901234567", true)).isEqualTo("0901234567");
        }

        @Test
        void delegatesToVnNormalize_whenGeneralFalse() {
            assertThat(AuthUseCaseImpl.normalizePhone("+981234567", false)).isEqualTo("981234567");
        }

        @Test
        void throwsNpe_whenGeneralNull() {
            assertThatThrownBy(() -> AuthUseCaseImpl.normalizePhone("0901234567", null))
                    .isInstanceOf(NullPointerException.class);
        }
    }
}
