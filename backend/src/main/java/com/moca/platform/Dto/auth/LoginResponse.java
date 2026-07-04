package com.moca.platform.Dto.auth;
public record LoginResponse(String accessToken, AuthUserDto user) {
}
