package com.moca.platform.Service.patient;

import com.moca.platform.Dto.appointment.AppointmentDto;
import com.moca.platform.Dto.patient.DoctorOptionDto;
import com.moca.platform.Dto.session.TestSessionSummaryDto;
import java.util.List;
import java.util.UUID;

public interface PatientApiUseCase {

    List<TestSessionSummaryDto> listSessions(UUID patientId);

    List<AppointmentDto> listAppointments(UUID patientId);

    List<DoctorOptionDto> listDoctorOptions(UUID patientId);
}
