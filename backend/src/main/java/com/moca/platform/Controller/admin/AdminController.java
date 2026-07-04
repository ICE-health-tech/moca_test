package com.moca.platform.Controller.admin;

import com.moca.platform.Dto.admin.AdminDoctorDto;
import com.moca.platform.Dto.admin.AdminStatsDto;
import com.moca.platform.Service.admin.AdminUseCase;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminUseCase admin;

    public AdminController(AdminUseCase admin) {
        this.admin = admin;
    }

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return admin.stats();
    }

    @GetMapping("/doctors")
    public List<AdminDoctorDto> doctors() {
        return admin.listDoctors();
    }
}
