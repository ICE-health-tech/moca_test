package com.moca.platform.Dto.auth;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DoctorLoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password) {
}
