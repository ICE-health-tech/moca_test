package com.moca.platform.service;

import com.moca.platform.DataLayer.protocol.UserEntity;
import com.moca.platform.dto.AuthUserDto;
import com.moca.platform.dto.LoginResponse;
import com.moca.platform.DataLayer.protocol.UserRepository;
import com.moca.platform.DataLayer.protocol.UserRole;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse patientLogin(String phoneNumber) {
        String phone = normalizePhone(phoneNumber.trim());
        log.info("patientLogin raw={} normalized={}", phoneNumber.trim(), phone);
        UserEntity user = users.findByPhoneNumber(phone)
                .orElseGet(() -> createPatient(phone));

        if (user.getRole() != UserRole.PATIENT) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Số điện thoại không hợp lệ");
        }

        return tokenResponse(user);
    }

    public LoginResponse doctorLogin(String email, String password) {
        UserEntity user = users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(AuthService::doctorUnauthorized);

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw doctorUnauthorized();
        }

        if (user.getRole() != UserRole.DOCTOR && user.getRole() != UserRole.ADMIN) {
            throw doctorUnauthorized();
        }

        return tokenResponse(user);
    }

    private UserEntity createPatient(String phone) {
        Instant now = Instant.now();
        UserEntity user = new UserEntity(
                null,
                null,
                phone,
                UserRole.PATIENT,
                "Người bệnh",
                passwordEncoder.encode(UUID.randomUUID().toString()),
                null,
                null,
                null,
                now,
                now);
        return users.save(user);
    }

    private LoginResponse tokenResponse(UserEntity user) {
        return new LoginResponse(UUID.randomUUID().toString(), AuthUserDto.from(user));
    }

    /** 0901234567 → 84901234567 */
    static String normalizePhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("0")) {
            return "84" + digits.substring(1);
        }
        return digits;
    }

    private static ResponseStatusException doctorUnauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
    }
}
