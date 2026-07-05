package com.moca.platform.Service.session;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moca.platform.DataLayer.protocol.session.ScoringMode;
import com.moca.platform.DataLayer.protocol.session.TestSectionScoreEntity;
import com.moca.platform.shared.Decimals;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

/** Provisional MoCA scoring from raw_answers JSON (mirrors frontend gradeTest). */
@Service
public class MocaAutoGrader {

    private static final int[] DIGITS_FORWARD = {2, 1, 8, 5, 4};
    private static final int[] DIGITS_BACKWARD = {7, 4, 2};
    private static final int[] SERIAL7 = {93, 86, 79, 72, 65};

    private final ObjectMapper objectMapper;

    public MocaAutoGrader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public GradeResult grade(Map<String, Object> rawAnswers, int educationYears) {
        JsonNode root = objectMapper.valueToTree(rawAnswers);
        List<SectionGrade> sections = new ArrayList<>();

        sections.add(new SectionGrade(
                "visuospatial",
                "Thị giác – không gian",
                5,
                0,
                ScoringMode.REVIEW,
                "Cần bác sĩ chấm bản vẽ (nối điểm, khối lập phương, đồng hồ)"));

        sections.add(gradeNaming(root));
        sections.add(new SectionGrade(
                "memory", "Trí nhớ (ghi nhận)", 0, 0, ScoringMode.AUTO, "Ghi nhận tức thì (không tính điểm)"));
        sections.add(gradeAttention(root));
        sections.add(gradeLanguage(root));
        sections.add(gradeAbstraction(root));
        sections.add(gradeDelayedRecall(root));
        sections.add(gradeOrientation(root));

        int autoTotal = sections.stream()
                .filter(s -> s.mode() == ScoringMode.AUTO)
                .mapToInt(SectionGrade::points)
                .sum();
        int bonus = educationYears <= 12 ? 1 : 0;
        int provisional = Math.min(30, autoTotal + bonus);
        String classification = classify(provisional);

        return new GradeResult(sections, autoTotal, bonus, provisional, classification);
    }

    public List<TestSectionScoreEntity> toEntities(UUID sessionId, GradeResult result) {
        List<TestSectionScoreEntity> rows = new ArrayList<>();
        for (SectionGrade section : result.sections()) {
            rows.add(TestSectionScoreEntity.create(
                    UUID.randomUUID(),
                    sessionId,
                    section.sectionKey(),
                    section.label(),
                    Decimals.score(section.maxPoints()),
                    Decimals.score(section.points()),
                    section.mode()));
        }
        return rows;
    }

    private SectionGrade gradeNaming(JsonNode root) {
        JsonNode naming = root.path("section_2_naming");
        int score = 0;
        score += matchAnimal(naming, "n1", "su tu", "lion");
        score += matchAnimal(naming, "n2", "te giac", "rhino", "rhinoceros");
        score += matchAnimal(naming, "n3", "lac da", "camel");
        return new SectionGrade("naming", "Gọi tên con vật", 3, score, ScoringMode.AUTO, null);
    }

    private int matchAnimal(JsonNode naming, String id, String... accept) {
        String text = normalize(naming.path(id).path("text").asText(""));
        if (text.isEmpty()) {
            return 0;
        }
        for (String token : accept) {
            if (text.contains(normalize(token))) {
                return 1;
            }
        }
        return 0;
    }

    private SectionGrade gradeAttention(JsonNode root) {
        String fwd = normalize(root.path("section_4a_forward").asText("")).replaceAll("\\D", "");
        String bwd = normalize(root.path("section_4a_backward").asText("")).replaceAll("\\D", "");
        int fwdOk = fwd.equals(digitsForward()) ? 1 : 0;
        StringBuilder bwdExpected = new StringBuilder();
        for (int i = DIGITS_BACKWARD.length - 1; i >= 0; i--) {
            bwdExpected.append(DIGITS_BACKWARD[i]);
        }
        int bwdOk = bwd.equals(bwdExpected.toString()) ? 1 : 0;
        int s4b = root.path("section_4b").path("score").asInt(0);
        JsonNode serial = root.path("section_4c");
        int correctSerial = 0;
        for (int i = 0; i < SERIAL7.length; i++) {
            if (serial.isArray() && serial.get(i).asInt(-1) == SERIAL7[i]) {
                correctSerial++;
            }
        }
        int s4c = correctSerial >= 4 ? 3 : correctSerial >= 2 ? 2 : correctSerial >= 1 ? 1 : 0;
        int total = fwdOk + bwdOk + s4b + s4c;
        return new SectionGrade("attention", "Sự chú ý", 6, total, ScoringMode.AUTO, null);
    }

    private SectionGrade gradeLanguage(JsonNode root) {
        JsonNode s5 = root.path("section_5");
        int s5Score = 0;
        boolean needsReview = false;
        for (int i = 0; i < 2; i++) {
            JsonNode entry = s5.path(String.valueOf(i));
            if (entry.isMissingNode() || entry.isNull()) {
                entry = s5.get(i);
            }
            if (entry == null || entry.isMissingNode() || entry.isNull()) {
                needsReview = true;
                continue;
            }
            if (entry.has("score")) {
                s5Score += entry.path("score").asInt(0);
            } else if (entry.has("transcript")) {
                needsReview = true;
            } else {
                needsReview = true;
            }
        }
        int s6 = root.path("section_6").path("score").asInt(0);
        int total = s5Score + s6;
        ScoringMode mode = needsReview ? ScoringMode.REVIEW : ScoringMode.AUTO;
        String note = needsReview ? "Cần bác sĩ nghe lại ghi âm nhắc lại câu" : null;
        return new SectionGrade("language", "Ngôn ngữ & lưu loát", 3, total, mode, note);
    }

    private SectionGrade gradeAbstraction(JsonNode root) {
        JsonNode abs = root.path("section_7");
        int score = 0;
        String[][] pairs = {
            {"phuong tien", "giao thong", "di chuyen", "di lai", "vehicle", "transport"},
            {"dung cu do", "do luong", "cong cu do", "measuring", "instrument"}
        };
        for (int i = 0; i < pairs.length; i++) {
            String text = normalize(abs.path(String.valueOf(i)).path("text").asText(""));
            if (text.isEmpty()) {
                text = normalize(abs.path("idx" + i).path("text").asText(""));
            }
            for (String token : pairs[i]) {
                if (text.contains(normalize(token))) {
                    score++;
                    break;
                }
            }
        }
        return new SectionGrade("abstraction", "Tư duy trừu tượng", 2, score, ScoringMode.AUTO, null);
    }

    private SectionGrade gradeDelayedRecall(JsonNode root) {
        JsonNode recall = root.path("section_8_inputs");
        String[] words = {"ve mat", "vai nhung", "nha tho", "hoa cuc", "mau do"};
        int score = 0;
        for (int i = 0; i < words.length; i++) {
            JsonNode cur = recall.path("word_" + (i + 1));
            if (cur.isMissingNode()) {
                continue;
            }
            if (cur.path("used_cue").asBoolean(false)) {
                continue;
            }
            if (normalize(cur.path("text").asText("")).equals(words[i])) {
                score++;
            }
        }
        return new SectionGrade("delayed", "Nhớ lại có trì hoãn", 5, score, ScoringMode.AUTO, null);
    }

    private SectionGrade gradeOrientation(JsonNode root) {
        JsonNode o = root.path("section_9");
        LocalDate today = LocalDate.now();
        int score = 0;
        if (o.path("date").asInt(-1) == today.getDayOfMonth()) {
            score++;
        }
        if (o.path("month").asInt(-1) == today.getMonthValue()) {
            score++;
        }
        if (o.path("year").asInt(-1) == today.getYear()) {
            score++;
        }
        String dayName = today.getDayOfWeek()
                .getDisplayName(TextStyle.FULL, new Locale("vi", "VN"));
        if (normalize(o.path("day").asText("")).equals(normalize(dayName))) {
            score++;
        }
        if (!o.path("place").asText("").isBlank()) {
            score++;
        }
        if (!o.path("city").asText("").isBlank()) {
            score++;
        }
        return new SectionGrade("orientation", "Định hướng", 6, score, ScoringMode.AUTO, null);
    }

    private static String digitsForward() {
        StringBuilder sb = new StringBuilder();
        for (int d : DIGITS_FORWARD) {
            sb.append(d);
        }
        return sb.toString();
    }

    private static String classify(int provisional) {
        if (provisional >= 26) {
            return "Nhận thức bình thường";
        }
        if (provisional >= 18) {
            return "Suy giảm nhận thức nhẹ (MCI)";
        }
        return "Suy giảm nhận thức nặng / Sa sút trí tuệ";
    }

    static String normalize(String s) {
        if (s == null) {
            return "";
        }
        String n = Normalizer.normalize(s.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replaceAll("\\s+", " ")
                .trim();
        return n;
    }

    public record SectionGrade(
            String sectionKey,
            String label,
            int maxPoints,
            int points,
            ScoringMode mode,
            String note) {}

    public record GradeResult(
            List<SectionGrade> sections,
            int autoTotal,
            int bonus,
            int provisional,
            String classification) {}
}
