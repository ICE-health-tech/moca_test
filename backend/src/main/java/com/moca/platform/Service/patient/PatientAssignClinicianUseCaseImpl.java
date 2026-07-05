package com.moca.platform.Service.patient;

import com.moca.platform.DataLayer.protocol.auth.UserEntity;
import com.moca.platform.DataLayer.protocol.auth.UserRepository;
import com.moca.platform.DataLayer.protocol.auth.UserRole;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentEntity;
import com.moca.platform.DataLayer.protocol.patient.PatientAssignmentRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PatientAssignClinicianUseCaseImpl implements PatientAssignClinicianUseCase {

    private final UserRepository users;
    private final PatientAssignmentRepository assignments;

    public PatientAssignClinicianUseCaseImpl(
            UserRepository users, PatientAssignmentRepository assignments) {
        this.users = users;
        this.assignments = assignments;
    }

    @Override
    @Transactional
    public void assignClinician(UUID patientId, UUID clinicianId) {
        requirePatient(patientId);
        requireDoctor(clinicianId);

        if (assignments.findByPatientIdAndDoctorIdAndIsCurrentTrue(patientId, clinicianId).isPresent()) {
            return;
        }

        assignments.findByPatientIdAndIsCurrentTrue(patientId).forEach(row -> {
            row.endAssignment();
            assignments.save(row);
        });
        assignments.save(PatientAssignmentEntity.assign(patientId, clinicianId));
    }

    private void requirePatient(UUID patientId) {
        UserEntity user = users.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bệnh nhân"));
        if (user.getRole() != UserRole.PATIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng không phải bệnh nhân");
        }
    }

    private void requireDoctor(UUID clinicianId) {
        UserEntity user = users.findById(clinicianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));
        if (user.getRole() != UserRole.DOCTOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng không phải bác sĩ");
        }
    }
}
