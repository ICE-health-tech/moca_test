package com.moca.platform.controller;

import com.moca.platform.dto.AppointmentDto;
import com.moca.platform.dto.AuthUserDto;
import com.moca.platform.dto.DoctorOptionDto;
import com.moca.platform.dto.PatientUpdateRequest;
import com.moca.platform.dto.TestSessionSummaryDto;
import com.moca.platform.service.PatientApiService;
import com.moca.platform.service.PatientUpdateService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final PatientApiService patientApi;
    private final PatientUpdateService patientUpdate;

    public PatientController(PatientApiService patientApi, PatientUpdateService patientUpdate) {
        this.patientApi = patientApi;
        this.patientUpdate = patientUpdate;
    }

    @GetMapping("/{patientId}/sessions")
    public List<TestSessionSummaryDto> sessions(@PathVariable UUID patientId) {
        return patientApi.listSessions(patientId);
    }

    @GetMapping("/{patientId}/appointments")
    public List<AppointmentDto> appointments(@PathVariable UUID patientId) {
        return patientApi.listAppointments(patientId);
    }

    @GetMapping("/{patientId}/doctors")
    public List<DoctorOptionDto> doctors(@PathVariable UUID patientId) {
        return patientApi.listDoctorOptions(patientId);
    }

    @PatchMapping("/{patientId}/profile")
    public AuthUserDto updateProfile(
            @PathVariable UUID patientId,
            @Valid @RequestBody PatientUpdateRequest body) {
        return patientUpdate.updateInformation(
                patientId,
                body.fullName(),
                body.email(),
                body.gender(),
                body.dateOfBirth(),
                body.educationYears());
    }
}
