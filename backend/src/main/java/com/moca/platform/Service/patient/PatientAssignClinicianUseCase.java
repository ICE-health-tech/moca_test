package com.moca.platform.Service.patient;

import java.util.UUID;

public interface PatientAssignClinicianUseCase {

    void assignClinician(UUID patientId, UUID clinicianId);
}
