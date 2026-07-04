package com.moca.platform.Service.doctor;

import com.moca.platform.Dto.doctor.ApproveReviewRequest;
import com.moca.platform.Dto.doctor.DoctorPatientDto;
import com.moca.platform.Dto.doctor.ReviewQueueItemDto;
import com.moca.platform.Dto.doctor.SessionDetailDto;
import java.util.List;
import java.util.UUID;

public interface DoctorReviewUseCase {

    List<ReviewQueueItemDto> listReviews(UUID doctorId);

    List<DoctorPatientDto> listPatients(UUID doctorId);

    SessionDetailDto getSessionDetail(UUID sessionId);

    SessionDetailDto approve(UUID sessionId, ApproveReviewRequest request);
}
