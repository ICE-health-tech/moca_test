package com.moca.platform.controller;

import com.moca.platform.dto.DoctorLoginRequest;
import com.moca.platform.dto.LoginResponse;
import com.moca.platform.dto.PatientLoginRequest;
import com.moca.platform.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Patient: phone only — no password. */
    @PostMapping("/patient/login")
    public LoginResponse patientLogin(@Valid @RequestBody PatientLoginRequest request) {
     
        return authService.patientLogin(request.phoneNumber());
    }

    /** Doctor / admin: email + password. */
    @PostMapping("/doctor/login")
    public LoginResponse doctorLogin(@Valid @RequestBody DoctorLoginRequest request) {
        return authService.doctorLogin(request.email(), request.password());
    }
}
