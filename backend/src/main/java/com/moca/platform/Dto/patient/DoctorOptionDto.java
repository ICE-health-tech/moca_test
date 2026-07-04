package com.moca.platform.Dto.patient;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record DoctorOptionDto(
        UUID id,
        String name,
        String specialty,
        String phone,
        String email,
        String workplace,
        String experience,
        @JsonProperty("isCurrent") boolean isCurrent) {
}
