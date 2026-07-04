package com.moca.platform.Dto.doctor;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record ApproveReviewRequest(
        @NotEmpty List<SectionScoreInput> scores) {

    public record SectionScoreInput(
            String sectionKey,
            @NotNull @Digits(integer = 3, fraction = 0) BigDecimal doctorScore) {
    }
}
