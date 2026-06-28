package com.moca.platform.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record PatientUpdateRequest(
        @NotBlank String fullName,
        String email,
        String gender,
        LocalDate dateOfBirth,
        Integer educationYears) {
}
