package com.moca.platform.Service.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileEntity;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionStatus;
import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * AdminUseCaseImpl tests — Mockito replaces all 3 repositories.
 *
 * <p>Flow: mock counts/list → call service → assert DTO.
 */
@ExtendWith(MockitoExtension.class)
class AdminUseCaseImplTest {

    @Mock
    UserRepository users;

    @Mock
    DoctorProfileRepository doctorProfiles;

    @Mock
    TestSessionRepository sessions;

    @InjectMocks
    AdminUseCaseImpl service;

    UUID doctorId;

    @BeforeEach
    void setUp() {
        doctorId = UUID.randomUUID();
    }

    @Nested
    class Stats {

        @Test
        void returnsCountsFromAllRepos() {
            when(users.countByRole(UserRole.DOCTOR)).thenReturn(5L);
            when(users.countByRole(UserRole.PATIENT)).thenReturn(100L);
            when(sessions.countByStatus(TestSessionStatus.PENDING_REVIEW)).thenReturn(3L);
            when(sessions.countSubmittedSince(any())).thenReturn(20L);

            var result = service.stats();

            assertThat(result.doctorCount()).isEqualTo(5);
            assertThat(result.patientCount()).isEqualTo(100);
            assertThat(result.pendingReviews()).isEqualTo(3);
            assertThat(result.testsThisMonth()).isEqualTo(20);
        }
    }

    @Nested
    class ListDoctors {

        @Test
        void returnsMappedDoctorsWithProfiles() {
            UUID id1 = UUID.randomUUID();
            UUID id2 = UUID.randomUUID();
            var doctor1 = new UserEntity(id1, "doc1@t.com", null, UserRole.DOCTOR, "BS. A", "hash", null, null, null, Instant.now(), Instant.now());
            var doctor2 = new UserEntity(id2, "doc2@t.com", null, UserRole.DOCTOR, "BS. B", "hash", null, null, null, Instant.now(), Instant.now());
            when(users.findAllDoctors()).thenReturn(List.of(doctor1, doctor2));
            var profile1 = mock(DoctorProfileEntity.class);
            when(profile1.getUserId()).thenReturn(id1);
            when(profile1.getSpecialty()).thenReturn("Thần kinh");
            when(profile1.isActive()).thenReturn(true);
            var profile2 = mock(DoctorProfileEntity.class);
            when(profile2.getUserId()).thenReturn(id2);
            when(profile2.getSpecialty()).thenReturn("Lão khoa");
            when(profile2.isActive()).thenReturn(false);
            when(doctorProfiles.findAllById(Set.of(id1, id2))).thenReturn(List.of(profile1, profile2));
            when(doctorProfiles.countCurrentPatientsGrouped()).thenReturn(List.of(
                    new Object[]{id1, 12L}, new Object[]{id2, 8L}));

            var result = service.listDoctors();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).name()).isEqualTo("BS. A");
            assertThat(result.get(0).specialty()).isEqualTo("Thần kinh");
            assertThat(result.get(0).patientCount()).isEqualTo(12);
            assertThat(result.get(0).active()).isTrue();
        }

        @Test
        void returnsEmpty_whenNoDoctors() {
            when(users.findAllDoctors()).thenReturn(List.of());

            assertThat(service.listDoctors()).isEmpty();
        }
    }
}
