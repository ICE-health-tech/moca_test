package com.moca.platform.DataLayer.protocol.doctor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    /** LOGIC: New doctor profile is active from day one.
     *    First → bind to the user's id (shared primary key).
     *    Then → store optional specialty + license as given.
     *    So → the doctor appears in admin/patient lists immediately. */
    public static DoctorProfileEntity create(UUID userId, String specialty, String licenseNumber) {
        DoctorProfileEntity profile = new DoctorProfileEntity();
        profile.userId = userId;
        profile.specialty = specialty;
        profile.licenseNumber = licenseNumber;
        profile.isActive = true;
        return profile;
    }
}
