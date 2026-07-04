package com.moca.platform.Controller.doctor;

import com.moca.platform.Dto.doctor.ApproveReviewRequest;
import com.moca.platform.Dto.doctor.DoctorPatientDto;
import com.moca.platform.Dto.doctor.ReviewQueueItemDto;
import com.moca.platform.Dto.doctor.SessionDetailDto;
import com.moca.platform.Service.doctor.DoctorReviewUseCase;
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
@RequestMapping("/api/doctor")
public class DoctorController {

    private final DoctorReviewUseCase reviews;

    public DoctorController(DoctorReviewUseCase reviews) {
        this.reviews = reviews;
    }

    @GetMapping("/{doctorId}/reviews")
    public List<ReviewQueueItemDto> reviews(@PathVariable UUID doctorId) {
        return reviews.listReviews(doctorId);
    }

    @GetMapping("/{doctorId}/patients")
    public List<DoctorPatientDto> patients(@PathVariable UUID doctorId) {
        return reviews.listPatients(doctorId);
    }

    @GetMapping("/reviews/{sessionId}")
    public SessionDetailDto sessionDetail(@PathVariable UUID sessionId) {
        return reviews.getSessionDetail(sessionId);
    }

    @PatchMapping("/reviews/{sessionId}/approve")
    public SessionDetailDto approve(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ApproveReviewRequest request) {
        return reviews.approve(sessionId, request);
    }
}
