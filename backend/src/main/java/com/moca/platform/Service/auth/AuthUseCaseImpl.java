package com.moca.platform.Service.auth;

import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileEntity;
import com.moca.platform.DataLayer.protocol.doctor.DoctorProfileRepository;
import com.moca.platform.Dto.auth.AuthUserDto;
import com.moca.platform.Dto.auth.DoctorSignupRequest;
import com.moca.platform.Dto.auth.LoginResponse;
import com.moca.platform.SecurityLayer.JwtService;

import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthUseCaseImpl implements AuthUseCase {

    private static final Logger log = LoggerFactory.getLogger(AuthUseCaseImpl.class);

    private final UserRepository users;
    private final DoctorProfileRepository doctorProfiles;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;

    public AuthUseCaseImpl(
            UserRepository users,
            DoctorProfileRepository doctorProfiles,
            PasswordEncoder passwordEncoder,
            JwtService jwt) {
        this.users = users;
        this.doctorProfiles = doctorProfiles;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    @Override
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

    @Override
    public LoginResponse doctorLogin(String email, String password) {
        UserEntity user = users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(AuthUseCaseImpl::doctorUnauthorized);

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw doctorUnauthorized();
        }

        if (user.getRole() != UserRole.DOCTOR && user.getRole() != UserRole.ADMIN) {
            throw doctorUnauthorized();
        }

        return tokenResponse(user);
    }

    /** LOGIC: Doctor signs up with email + password.
     *    First → reject if the email is already taken (409).
     *    Then → save the user with a hashed password and DOCTOR role,
     *           plus an active doctor profile (specialty, license).
     *    So → the new doctor can log in right away and appears in lists. */
    @Override
    @Transactional
    public LoginResponse doctorSignup(DoctorSignupRequest request) {
        String email = request.email().trim();
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký");
        }

        Instant now = Instant.now();
        UserEntity user = users.save(new UserEntity(
                null,
                email,
                null,
                UserRole.DOCTOR,
                request.fullName().trim(),
                passwordEncoder.encode(request.password()),
                null,
                null,
                null,
                now,
                now));

        doctorProfiles.save(DoctorProfileEntity.create(
                user.getId(),
                blankToNull(request.specialty()),
                blankToNull(request.licenseNumber())));

        return tokenResponse(user);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
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
        return new LoginResponse(jwt.generate(user), AuthUserDto.from(user));
    }

    /** 0901234567 → 84901234567 */
    static String normalizePhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("0")) {
            return "84" + digits.substring(1);
        }
        return digits;
    }
    static String normalizePhone(String raw,Boolean general){
        if(general){
        return raw.replace("+","");
        }
        return normalizePhone(raw);
    }

    private static ResponseStatusException doctorUnauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
    }
}
