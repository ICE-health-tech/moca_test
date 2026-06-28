package com.moca.platform.dto;
import com.moca.platform.DataLayer.protocol.TestSessionStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DoctorPatientDto(
        UUID id,
        String name,
        String phone,
        Instant lastTestAt,
        String lastScoreLabel,
        List<DoctorPatientSessionDto> sessions) {
}
