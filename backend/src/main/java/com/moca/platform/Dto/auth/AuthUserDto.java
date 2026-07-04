package com.moca.platform.Dto.auth;
import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import java.time.LocalDate;
import java.util.UUID;

public record AuthUserDto(
        UUID id,
        String email,
        String phoneNumber,
        String fullName,
        UserRole role,
        String gender,
        LocalDate dateOfBirth,
        Integer educationYears) {

    public static AuthUserDto from(UserEntity user) {
        String email = user.getEmail() != null ? user.getEmail() : "";
        String phone = user.getPhoneNumber() != null ? user.getPhoneNumber() : "";
        String gender = user.getGender() != null ? user.getGender() : "";
        return new AuthUserDto(
                user.getId(),
                email,
                phone,
                user.getFullName(),
                user.getRole(),
                gender,
                user.getDateOfBirth(),
                user.getEducationYears());
    }
}
