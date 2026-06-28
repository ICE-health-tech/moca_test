package com.moca.platform.dto;
import com.moca.platform.DataLayer.protocol.AppointmentStatus;
import java.time.Instant;
import java.util.UUID;

public record AppointmentDto(
        UUID id,
        String doctorName,
        Instant scheduledAt,
        AppointmentStatus status) {
}
