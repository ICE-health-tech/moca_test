package com.moca.platform.Service.doctor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentRepository;
import com.moca.platform.DataLayer.protocol.session.ScoringMode;
import com.moca.platform.DataLayer.protocol.session.TestSectionScoreEntity;
import com.moca.platform.DataLayer.protocol.session.TestSectionScoreRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.session.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.session.TestSessionStatus;
import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.Dto.doctor.ApproveReviewRequest;
import com.moca.platform.shared.Decimals;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * DoctorReviewUseCaseImpl tests — Mockito replaces all 4 repositories.
 *
 * <p>Flow: mock DB → call service → assert DTO or exception.
 */
@ExtendWith(MockitoExtension.class)
class DoctorReviewUseCaseImplTest {

    @Mock
    TestSessionRepository sessions;

    @Mock
    TestSectionScoreRepository sectionScores;

    @Mock
    UserRepository users;

    @Mock
    PatientAssignmentRepository assignments;

    @InjectMocks
    DoctorReviewUseCaseImpl service;

    @Captor
    ArgumentCaptor<List<TestSectionScoreEntity>> scoresCaptor;

    UUID doctorId;
    UUID patientId;

    @BeforeEach
    void setUp() {
        doctorId = UUID.randomUUID();
        patientId = UUID.randomUUID();
    }

    @Nested
    class ListReviews {

        @Test
        void returnsPendingForAssignedDoctor() {
            when(users.findById(doctorId)).thenReturn(Optional.of(doctor()));
            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    UUID.randomUUID(), patientId, "set-a", "{}", 11, Instant.now());
            when(sessions.findPendingForDoctor(doctorId, TestSessionStatus.PENDING_REVIEW))
                    .thenReturn(List.of(session));
            var patient = patient();
            when(users.findAllById(Set.of(patientId))).thenReturn(List.of(patient));

            var result = service.listReviews(doctorId);

            assertThat(result).hasSize(1);
        }

        @Test
        void fallsBackToGlobalQueue_whenNoAssignedPending() {
            when(users.findById(doctorId)).thenReturn(Optional.of(doctor()));
            when(sessions.findPendingForDoctor(doctorId, TestSessionStatus.PENDING_REVIEW))
                    .thenReturn(List.of());
            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    UUID.randomUUID(), patientId, "set-b", "{}", 11, Instant.now());
            when(sessions.findByStatusOrderBySubmittedAtAsc(TestSessionStatus.PENDING_REVIEW))
                    .thenReturn(List.of(session));
            var patient = patient();
            when(users.findAllById(Set.of(patientId))).thenReturn(List.of(patient));

            var result = service.listReviews(doctorId);

            assertThat(result).hasSize(1);
        }

        @Test
        void returnsEmpty_whenNoPendingReviews() {
            when(users.findById(doctorId)).thenReturn(Optional.of(doctor()));
            when(sessions.findPendingForDoctor(doctorId, TestSessionStatus.PENDING_REVIEW))
                    .thenReturn(List.of());
            when(sessions.findByStatusOrderBySubmittedAtAsc(TestSessionStatus.PENDING_REVIEW))
                    .thenReturn(List.of());

            assertThat(service.listReviews(doctorId)).isEmpty();
        }
    }

    @Nested
    class ListPatients {

        @Test
        void returnsAssignedPatientsWithSessions() {
            when(users.findById(doctorId)).thenReturn(Optional.of(doctor()));
            when(assignments.findCurrentPatientIdsByDoctorId(doctorId))
                    .thenReturn(List.of(patientId));
            var patient = patient();
            when(users.findAllById(List.of(patientId))).thenReturn(List.of(patient));
            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    UUID.randomUUID(), patientId, "set-a", "{}", 11, Instant.now());
            when(sessions.findByPatientIdInOrderBySubmittedAtDesc(List.of(patientId)))
                    .thenReturn(List.of(session));

            var result = service.listPatients(doctorId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Người bệnh");
        }

        @Test
        void returnsEmpty_whenNoPatients() {
            when(users.findById(doctorId)).thenReturn(Optional.of(doctor()));
            when(assignments.findCurrentPatientIdsByDoctorId(doctorId))
                    .thenReturn(List.of());

            assertThat(service.listPatients(doctorId)).isEmpty();
        }
    }

    @Nested
    class GetSessionDetail {

        @Test
        void returnsDetailWithScores() {
            UUID sessionId = UUID.randomUUID();
            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    sessionId, patientId, "set-a", "{}", 11, Instant.now());
            when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
            when(users.findById(patientId)).thenReturn(Optional.of(patient()));
            TestSectionScoreEntity score = TestSectionScoreEntity.create(
                    UUID.randomUUID(), sessionId, "section_1", "Memory",
                    Decimals.score(5), Decimals.score(4), ScoringMode.AUTO);
            when(sectionScores.findBySessionIdOrderBySectionKeyAsc(sessionId))
                    .thenReturn(List.of(score));

            var result = service.getSessionDetail(sessionId);

            assertThat(result.patientName()).isEqualTo("Người bệnh");
            assertThat(result.sectionScores()).hasSize(1);
        }

        @Test
        void throws404_whenSessionNotFound() {
            when(sessions.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getSessionDetail(UUID.randomUUID()))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting("statusCode")
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    class Approve {

        @Test
        void updatesScoresAndFinalizesSession() {
            UUID sessionId = UUID.randomUUID();
            TestSessionEntity session = TestSessionEntity.createSubmitted(
                    sessionId, patientId, "set-a", "{}", 11, Instant.now());
            when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
            var existingScore = TestSectionScoreEntity.create(
                    UUID.randomUUID(), sessionId, "section_1", "Memory",
                    Decimals.score(5), Decimals.score(3), ScoringMode.AUTO);
            when(sectionScores.findBySessionIdOrderBySectionKeyAsc(sessionId))
                    .thenReturn(List.of(existingScore));

            var request = new ApproveReviewRequest(List.of(
                    new ApproveReviewRequest.SectionScoreInput("section_1", Decimals.score(5))));

            var result = service.approve(sessionId, request);

            assertThat(result.status()).isEqualTo(TestSessionStatus.FINALIZED);
            assertThat(result.finalScore()).isEqualByComparingTo(Decimals.score(5));
        }

        @Test
        void throws400_whenSessionNotPending() {
            UUID sessionId = UUID.randomUUID();
            TestSessionEntity session = mock(TestSessionEntity.class);
            when(session.getStatus()).thenReturn(TestSessionStatus.FINALIZED);
            when(sessions.findById(sessionId)).thenReturn(Optional.of(session));

            var request = new ApproveReviewRequest(List.of(
                    new ApproveReviewRequest.SectionScoreInput("section_1", Decimals.score(5))));

            assertThatThrownBy(() -> service.approve(sessionId, request))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(e -> {
                        ResponseStatusException ex = (ResponseStatusException) e;
                        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                        assertThat(ex.getReason()).isEqualTo("Phiên không ở trạng thái chờ duyệt");
                    });
        }
    }

    // ── fixtures ──

    private UserEntity doctor() {
        return new UserEntity(doctorId, "doc@t.com", null, UserRole.DOCTOR,
                "BS. A", "hash", null, null, null, Instant.now(), Instant.now());
    }

    private UserEntity patient() {
        return new UserEntity(patientId, null, "84901234567", UserRole.PATIENT,
                "Người bệnh", "hash", null, null, null, Instant.now(), Instant.now());
    }
}
