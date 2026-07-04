package com.moca.platform.Service.patient;

import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.Dto.auth.AuthUserDto;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PatientUpdateUseCaseImpl implements PatientUpdateUseCase {

    private final UserRepository users;

    public PatientUpdateUseCaseImpl(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional
    public AuthUserDto updateInformation(
            UUID id,
            String fullName,
            String email,
            String gender,
            LocalDate dateOfBirth,
            Integer educationYears) {
        UserEntity user = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        if (user.getRole() != UserRole.PATIENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ bệnh nhân mới được cập nhật");
        }

        user.updateProfile(fullName, email, gender, dateOfBirth, educationYears);
        
        
        
        
        return AuthUserDto.from(users.save(user));
    }
}
