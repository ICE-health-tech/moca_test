package com.moca.platform.dto;
public record SectionScoreDto(
        String sectionKey,
        String label,
        int maxPoints,
        Integer autoScore,
        Integer doctorScore,
        String note) {
}
