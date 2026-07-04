package com.moca.platform.Service.patient;

import com.moca.platform.Dto.auth.AuthUserDto;
import java.time.LocalDate;
import java.util.UUID;

public interface PatientUpdateUseCase {

    AuthUserDto updateInformation(
            UUID id,
            String fullName,
            String email,
            String gender,
            LocalDate dateOfBirth,
            Integer educationYears);
}
