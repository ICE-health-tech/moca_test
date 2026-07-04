package com.moca.platform.Service.admin;

import com.moca.platform.Dto.admin.AdminDoctorDto;
import com.moca.platform.Dto.admin.AdminStatsDto;
import java.util.List;

public interface AdminUseCase {

    AdminStatsDto stats();

    List<AdminDoctorDto> listDoctors();
}
