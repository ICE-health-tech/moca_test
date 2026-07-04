package com.moca.platform.Controller.auth;

import com.moca.platform.Dto.auth.DoctorLoginRequest;
import com.moca.platform.Dto.auth.DoctorSignupRequest;
import com.moca.platform.Dto.auth.LoginResponse;
import com.moca.platform.Dto.auth.PatientLoginRequest;
import com.moca.platform.Service.auth.AuthUseCase;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthUseCase auth;

    public AuthController(AuthUseCase auth) {
        this.auth = auth;
    }

    /** Patient: phone only — no password. */
    @PostMapping("/patient/login")
    public LoginResponse patientLogin(@Valid @RequestBody PatientLoginRequest request) {
     
        return auth.patientLogin(request.phoneNumber());
    }

    /** Doctor / admin: email + password. */
    @PostMapping({"/doctor/login", "/staff/login"})
    public LoginResponse doctorLogin(@Valid @RequestBody DoctorLoginRequest request) {
        return auth.doctorLogin(request.email(), request.password());
    }

    /** Doctor: register with email + password → JWT ngay sau khi tạo. */
    @PostMapping({"/doctor/signup", "/staff/signup"})
    public LoginResponse doctorSignup(@Valid @RequestBody DoctorSignupRequest request) {
        return auth.doctorSignup(request);
    }
}
