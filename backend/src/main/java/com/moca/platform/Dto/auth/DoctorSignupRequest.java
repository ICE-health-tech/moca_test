package com.moca.platform.Dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DoctorSignupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự") String password,
        @NotBlank String fullName,
        String specialty,
        String licenseNumber) {
}
