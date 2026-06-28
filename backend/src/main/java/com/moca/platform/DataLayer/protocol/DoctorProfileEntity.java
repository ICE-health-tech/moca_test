package com.moca.platform.DataLayer.protocol;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "doctor_profiles", schema = "public")
public class DoctorProfileEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    private String specialty;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    protected DoctorProfileEntity() {
    }

    public UUID getUserId() {
        return userId;
    }

    public String getSpecialty() {
        return specialty;
    }

    public boolean isActive() {
        return isActive;
    }
}
