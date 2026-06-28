package com.moca.platform.service;

import com.moca.platform.DataLayer.protocol.PatientAssignmentRepository;
import com.moca.platform.dto.ApproveReviewRequest;
import com.moca.platform.dto.DoctorPatientDto;
import com.moca.platform.dto.DoctorPatientSessionDto;
import com.moca.platform.dto.ReviewQueueItemDto;
import com.moca.platform.dto.SectionScoreDto;
import com.moca.platform.dto.SessionDetailDto;
import com.moca.platform.DataLayer.protocol.ScoringMode;
import com.moca.platform.DataLayer.protocol.TestSectionScoreEntity;
import com.moca.platform.DataLayer.protocol.TestSectionScoreRepository;
import com.moca.platform.DataLayer.protocol.TestSessionEntity;
import com.moca.platform.DataLayer.protocol.TestSessionRepository;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
import com.moca.platform.DataLayer.protocol.UserEntity;
import com.moca.platform.DataLayer.protocol.UserRepository;
import com.moca.platform.DataLayer.protocol.UserRole;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DoctorReviewService {

    private static final int MAX_MOCA_SCORE = 30;

    private final TestSessionRepository sessions;
    private final TestSectionScoreRepository sectionScores;
    private final UserRepository users;
    private final PatientAssignmentRepository assignments;

    public DoctorReviewService(
            TestSessionRepository sessions,
            TestSectionScoreRepository sectionScores,
            UserRepository users,
            PatientAssignmentRepository assignments) {
        this.sessions = sessions;
        this.sectionScores = sectionScores;
        this.users = users;
        this.assignments = assignments;
    }

    // 1 validate → 2 sessions → 3 batch patients → 4 map DTO (no DB in loop)
    @Transactional(readOnly = true)
    public List<ReviewQueueItemDto> listReviews(UUID doctorId) {
        requireDoctor(doctorId);
        List<TestSessionEntity> pending = sessions.findPendingForDoctor(doctorId, TestSessionStatus.PENDING_REVIEW);
        if (pending.isEmpty()) {
            pending = sessions.findByStatusOrderBySubmittedAtAsc(TestSessionStatus.PENDING_REVIEW);
        }
        if (pending.isEmpty()) {
            return List.of();
        }

        Set<UUID> patientIds = pending.stream()
                .map(TestSessionEntity::getPatientId)
                .collect(Collectors.toSet());
        Map<UUID, UserEntity> patientsById = users.findAllById(patientIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        return pending.stream()
                .map(session -> toReviewItem(session, patientsById))
                .toList();
    }

    // 1 validate → 2 patient ids → 3 batch users + sessions → 4 map DTO (no DB in loop)
    @Transactional(readOnly = true)
    public List<DoctorPatientDto> listPatients(UUID doctorId) {
        requireDoctor(doctorId);
        List<UUID> patientIds = assignments.findCurrentPatientIdsByDoctorId(doctorId);
        if (patientIds.isEmpty()) {
            return List.of();
        }

        Map<UUID, UserEntity> patientsById = users.findAllById(patientIds).stream()
                .filter(u -> u.getRole() == UserRole.PATIENT)
                .collect(Collectors.toMap(UserEntity::getId, u -> u));
        Map<UUID, List<TestSessionEntity>> sessionsByPatientId =
                sessions.findByPatientIdInOrderBySubmittedAtDesc(patientIds).stream()
                        .collect(Collectors.groupingBy(TestSessionEntity::getPatientId));

        return patientIds.stream()
                .map(patientsById::get)
                .filter(Objects::nonNull)
                .map(patient -> toDoctorPatient(
                        patient,
                        sessionsByPatientId.getOrDefault(patient.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SessionDetailDto getSessionDetail(UUID sessionId) {
        TestSessionEntity session = sessions.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên"));
        return toSessionDetail(session);
    }

    // 1 load session → 2 batch section scores → 3 update in memory → 4 saveAll
    @Transactional
    public SessionDetailDto approve(UUID sessionId, ApproveReviewRequest request) {
        TestSessionEntity session = sessions.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên"));
        if (session.getStatus() != TestSessionStatus.PENDING_REVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phiên không ở trạng thái chờ duyệt");
        }

        Map<String, TestSectionScoreEntity> scoresByKey = new HashMap<>();
        for (TestSectionScoreEntity row : sectionScores.findBySessionIdOrderBySectionKeyAsc(sessionId)) {
            scoresByKey.put(row.getSectionKey(), row);
        }

        int total = 0;
        List<TestSectionScoreEntity> toSave = new ArrayList<>();
        for (ApproveReviewRequest.SectionScoreInput input : request.scores()) {
            TestSectionScoreEntity row = scoresByKey.computeIfAbsent(
                    input.sectionKey(),
                    key -> TestSectionScoreEntity.create(
                            UUID.randomUUID(),
                            sessionId,
                            key,
                            key,
                            0,
                            0,
                            ScoringMode.REVIEW));
            row.setDoctorOverride(input.doctorScore());
            toSave.add(row);
            total += input.doctorScore();
        }
        sectionScores.saveAll(toSave);

        session.finalizeReview(total, classify(total), null, Instant.now());
        sessions.save(session);
        return toSessionDetail(session);
    }

    private ReviewQueueItemDto toReviewItem(TestSessionEntity session, Map<UUID, UserEntity> patientsById) {
        String patientName = Optional.ofNullable(patientsById.get(session.getPatientId()))
                .map(UserEntity::getFullName)
                .orElse("Bệnh nhân");
        return new ReviewQueueItemDto(
                session.getId(),
                patientName,
                session.getSubmittedAt(),
                session.getAutoScore(),
                session.getSetId());
    }

    private DoctorPatientDto toDoctorPatient(UserEntity patient, List<TestSessionEntity> rows) {
        List<DoctorPatientSessionDto> sessionDtos = rows.stream()
                .sorted(Comparator.comparing(
                        TestSessionEntity::getSubmittedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toPatientSession)
                .toList();
        TestSessionEntity latest = rows.stream()
                .filter(s -> s.getSubmittedAt() != null)
                .max(Comparator.comparing(TestSessionEntity::getSubmittedAt))
                .orElse(null);
        Instant lastTestAt = latest != null ? latest.getSubmittedAt() : null;
        String lastScoreLabel = latest != null ? formatScoreLabel(latest) : "—";
        return new DoctorPatientDto(
                patient.getId(),
                patient.getFullName(),
                patient.getPhoneNumber() != null ? patient.getPhoneNumber() : "",
                lastTestAt,
                lastScoreLabel,
                sessionDtos);
    }

    private DoctorPatientSessionDto toPatientSession(TestSessionEntity session) {
        Integer score = session.getFinalScore() != null ? session.getFinalScore() : session.getAutoScore();
        return new DoctorPatientSessionDto(
                session.getId(),
                session.getSubmittedAt(),
                score,
                MAX_MOCA_SCORE,
                session.getStatus(),
                session.getClassification());
    }

    private SessionDetailDto toSessionDetail(TestSessionEntity session) {
        String patientName = users.findById(session.getPatientId())
                .map(UserEntity::getFullName)
                .orElse("Bệnh nhân");
        List<SectionScoreDto> scores = sectionScores.findBySessionIdOrderBySectionKeyAsc(session.getId()).stream()
                .map(row -> new SectionScoreDto(
                        row.getSectionKey(),
                        row.getLabel(),
                        row.getMaxPoints(),
                        row.getPoints(),
                        row.getDoctorOverride(),
                        null))
                .toList();
        return new SessionDetailDto(
                session.getId(),
                session.getPatientId(),
                patientName,
                session.getSubmittedAt(),
                session.getSetId(),
                session.getStatus(),
                session.getAutoScore(),
                session.getFinalScore(),
                session.getClassification(),
                scores);
    }

    private void requireDoctor(UUID doctorId) {
        UserEntity user = users.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));
        if (user.getRole() != UserRole.DOCTOR && user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng không phải bác sĩ");
        }
    }

    private static String formatScoreLabel(TestSessionEntity session) {
        Integer score = session.getFinalScore() != null ? session.getFinalScore() : session.getAutoScore();
        if (score == null) {
            return "—";
        }
        if (session.getStatus() == TestSessionStatus.PENDING_REVIEW) {
            return score + " (chờ)";
        }
        return String.valueOf(score);
    }

    private static String classify(int score) {
        return score >= 26 ? "Nhận thức bình thường" : "Dưới ngưỡng bình thường";
    }
}
