package com.moca.platform.Dto.admin;
import java.util.UUID;

public record AdminDoctorDto(
        UUID id,
        String name,
        String specialty,
        long patientCount,
        boolean active) {
}
