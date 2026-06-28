package com.moca.platform.dto;
public record AdminStatsDto(
        long doctorCount,
        long patientCount,
        long pendingReviews,
        long testsThisMonth) {
}
