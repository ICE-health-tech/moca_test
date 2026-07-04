package com.moca.platform.Service.auth;

import com.moca.platform.Dto.auth.LoginResponse;

public interface AuthUseCase {

    LoginResponse patientLogin(String phoneNumber);

    LoginResponse doctorLogin(String email, String password);
}
