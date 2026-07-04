package com.moca.platform.Dto.admin;
public record AdminStatsDto(
        long doctorCount,
        long patientCount,
        long pendingReviews,
        long testsThisMonth) {
}
