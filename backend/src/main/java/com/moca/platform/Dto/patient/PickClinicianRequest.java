package com.moca.platform.Dto.patient;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PickClinicianRequest(@NotNull UUID clinicianId) {}
