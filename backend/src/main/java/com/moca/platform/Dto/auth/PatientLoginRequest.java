package com.moca.platform.Dto.auth;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record PatientLoginRequest(
        @JsonProperty("phone_number")
        @NotBlank String phoneNumber) {
}
