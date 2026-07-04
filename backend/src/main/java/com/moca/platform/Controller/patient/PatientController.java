package com.moca.platform.Controller.patient;

import com.moca.platform.Dto.appointment.AppointmentDto;
import com.moca.platform.Dto.auth.AuthUserDto;
import com.moca.platform.Dto.patient.DoctorOptionDto;
import com.moca.platform.Dto.patient.PatientUpdateRequest;
import com.moca.platform.Dto.session.TestSessionSummaryDto;
import com.moca.platform.Service.patient.PatientApiUseCase;
import com.moca.platform.Service.patient.PatientUpdateUseCase;
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

    private final PatientApiUseCase patientApi;
    private final PatientUpdateUseCase patientUpdate;

    public PatientController(PatientApiUseCase patientApi, PatientUpdateUseCase patientUpdate) {
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

    @GetMapping("/{patientId}/clinicians")
    public List<DoctorOptionDto> clinicians(@PathVariable UUID patientId) {
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
