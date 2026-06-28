package com.moca.platform.dto;
import java.util.UUID;

public record AdminDoctorDto(
        UUID id,
        String name,
        String specialty,
        long patientCount,
        boolean active) {
}
