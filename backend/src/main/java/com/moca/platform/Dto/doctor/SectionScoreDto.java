package com.moca.platform.Dto.doctor;

import java.math.BigDecimal;

public record SectionScoreDto(
        String sectionKey,
        String label,
        BigDecimal maxPoints,
        BigDecimal autoScore,
        BigDecimal doctorScore,
        String note) {
}
