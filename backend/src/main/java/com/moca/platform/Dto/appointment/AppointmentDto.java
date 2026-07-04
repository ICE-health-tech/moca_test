package com.moca.platform.Dto.appointment;
import com.moca.platform.DataLayer.protocol.appointment.AppointmentStatus;
import java.time.Instant;
import java.util.UUID;

public record AppointmentDto(
        UUID id,
        String doctorName,
        Instant scheduledAt,
        AppointmentStatus status) {
}
