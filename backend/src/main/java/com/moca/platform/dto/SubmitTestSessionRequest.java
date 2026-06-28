package com.moca.platform.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;

public record SubmitTestSessionRequest(
        @NotNull UUID patientId,
        @NotBlank String setId,
        @NotNull Map<String, Object> rawAnswers,
        int educationYears) {
}
