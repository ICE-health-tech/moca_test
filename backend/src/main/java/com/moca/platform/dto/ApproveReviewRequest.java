package com.moca.platform.dto;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ApproveReviewRequest(
        @NotEmpty List<SectionScoreInput> scores) {

    public record SectionScoreInput(
            String sectionKey,
            int doctorScore) {
    }
}
