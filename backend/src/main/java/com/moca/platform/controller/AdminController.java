package com.moca.platform.controller;

import com.moca.platform.dto.AdminDoctorDto;
import com.moca.platform.dto.AdminStatsDto;
import com.moca.platform.service.AdminApiService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminApiService adminApi;

    public AdminController(AdminApiService adminApi) {
        this.adminApi = adminApi;
    }

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return adminApi.stats();
    }

    @GetMapping("/doctors")
    public List<AdminDoctorDto> doctors() {
        return adminApi.listDoctors();
    }
}
