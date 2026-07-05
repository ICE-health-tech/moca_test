package com.moca.platform.Service.doctor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.moca.platform.Dto.doctor.DoctorPatientDto;
import com.moca.platform.Dto.doctor.DoctorPatientSessionDto;
import com.moca.platform.Dto.doctor.ReviewQueueItemDto;
import com.moca.platform.Dto.doctor.SectionScoreDto;
import com.moca.platform.Dto.doctor.SessionDetailDto;
import com.moca.platform.Service.session.MocaAutoGrader;
import com.moca.platform.shared.Decimals;

import java.math.BigDecimal;
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
public class DoctorReviewUseCaseImpl implements DoctorReviewUseCase {

    private static final BigDecimal MAX_MOCA_SCORE = Decimals.score(30);
    private static final BigDecimal NORMAL_THRESHOLD = Decimals.score(26);

    private final TestSessionRepository sessions;
    private final TestSectionScoreRepository sectionScores;
    private final UserRepository users;
    private final PatientAssignmentRepository assignments;
    private final MocaAutoGrader grader;
    private final ObjectMapper objectMapper;

    public DoctorReviewUseCaseImpl(
            TestSessionRepository sessions,
            TestSectionScoreRepository sectionScores,
            UserRepository users,
            PatientAssignmentRepository assignments,
            MocaAutoGrader grader,
            ObjectMapper objectMapper) {
        this.sessions = sessions;
        this.sectionScores = sectionScores;
        this.users = users;
        this.assignments = assignments;
        this.grader = grader;
        this.objectMapper = objectMapper;
    }

    // 1 validate → 2 sessions → 3 batch patients → 4 map DTO (no DB in loop)
    @Override
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
    @Override
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

    @Override
    @Transactional
    public SessionDetailDto getSessionDetail(UUID sessionId) {
        TestSessionEntity session = sessions.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên"));
        ensureSectionScores(session);
        return toSessionDetail(session);
    }

    // 1 load session → 2 batch section scores → 3 update in memory → 4 saveAll
    @Override
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

        BigDecimal total = Decimals.zeroScore();
        List<TestSectionScoreEntity> toSave = new ArrayList<>();
        for (ApproveReviewRequest.SectionScoreInput input : request.scores()) {
            TestSectionScoreEntity row = scoresByKey.computeIfAbsent(
                    input.sectionKey(),
                    key -> TestSectionScoreEntity.create(
                            UUID.randomUUID(),
                            sessionId,
                            key,
                            key,
                            Decimals.zeroScore(),
                            Decimals.zeroScore(),
                            ScoringMode.REVIEW));
            row.setDoctorOverride(input.doctorScore());
            toSave.add(row);
            total = total.add(Decimals.normalizeScore(input.doctorScore()));
        }
        sectionScores.saveAll(toSave);

        BigDecimal bonus = session.getEducationBonus() != null
                ? session.getEducationBonus()
                : Decimals.zeroScore();
        BigDecimal finalScore = total.add(bonus).min(MAX_MOCA_SCORE);

        session.finalizeReview(finalScore, classify(finalScore), null, Instant.now());
        sessions.save(session);
        return toSessionDetail(session);
    }

    private void ensureSectionScores(TestSessionEntity session) {
        List<TestSectionScoreEntity> existing =
                sectionScores.findBySessionIdOrderBySectionKeyAsc(session.getId());
        if (!existing.isEmpty()) {
            return;
        }

        Map<String, Object> rawAnswers = parseRawAnswers(session.getRawAnswers());
        int educationYears = educationYearsFor(session);
        MocaAutoGrader.GradeResult graded = grader.grade(rawAnswers, educationYears);
        session.applyProvisionalGrade(
                Decimals.score(graded.provisional()),
                graded.classification());
        sessions.save(session);
        sectionScores.saveAll(grader.toEntities(session.getId(), graded));
    }

    private Map<String, Object> parseRawAnswers(String rawAnswersJson) {
        try {
            return objectMapper.readValue(rawAnswersJson, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("raw_answers JSON is invalid for session", e);
        }
    }

    private int educationYearsFor(TestSessionEntity session) {
        return users.findById(session.getPatientId())
                .map(UserEntity::getEducationYears)
                .filter(years -> years != null && years > 0)
                .orElseGet(() -> session.getEducationBonus() != null
                                && session.getEducationBonus().compareTo(BigDecimal.ONE) >= 0
                        ? 12
                        : 16);
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
        BigDecimal score = session.getFinalScore() != null ? session.getFinalScore() : session.getAutoScore();
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
        Map<String, String> notesByKey = graderNotesFor(session);
        List<SectionScoreDto> scores = sectionScores.findBySessionIdOrderBySectionKeyAsc(session.getId()).stream()
                .map(row -> new SectionScoreDto(
                        row.getSectionKey(),
                        row.getLabel(),
                        row.getMaxPoints(),
                        row.getPoints(),
                        row.getDoctorOverride(),
                        notesByKey.get(row.getSectionKey())))
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
                session.getEducationBonus(),
                scores);
    }

    private Map<String, String> graderNotesFor(TestSessionEntity session) {
        try {
            Map<String, Object> rawAnswers = parseRawAnswers(session.getRawAnswers());
            int educationYears = educationYearsFor(session);
            return grader.grade(rawAnswers, educationYears).sections().stream()
                    .filter(section -> section.note() != null)
                    .collect(Collectors.toMap(
                            MocaAutoGrader.SectionGrade::sectionKey,
                            MocaAutoGrader.SectionGrade::note,
                            (a, b) -> a));
        } catch (Exception e) {
            return Map.of();
        }
    }

    private void requireDoctor(UUID doctorId) {
        UserEntity user = users.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));
        if (user.getRole() != UserRole.DOCTOR && user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng không phải bác sĩ");
        }
    }

    private static String formatScoreLabel(TestSessionEntity session) {
        BigDecimal score = session.getFinalScore() != null ? session.getFinalScore() : session.getAutoScore();
        if (score == null) {
            return "—";
        }
        String label = score.stripTrailingZeros().toPlainString();
        if (session.getStatus() == TestSessionStatus.PENDING_REVIEW) {
            return label + " (chờ)";
        }
        return label;
    }

    private static String classify(BigDecimal score) {
        return score.compareTo(NORMAL_THRESHOLD) >= 0
                ? "Nhận thức bình thường"
                : "Dưới ngưỡng bình thường";
    }
}
