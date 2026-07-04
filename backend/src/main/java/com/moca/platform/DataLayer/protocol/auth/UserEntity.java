package com.moca.platform.DataLayer.protocol.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "users", schema = "public")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "email", unique = true)
    @Email(message = "Email không hợp lệ")
    private String email;

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "user_role")
    private UserRole role;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "education_years")
    private Integer educationYears;

    @Column(name = "gender")
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserEntity(UUID id, String email, String phoneNumber, UserRole role,
                      String fullName, String passwordHash, Integer educationYears, String gender,
                      LocalDate dateOfBirth, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.educationYears = educationYears;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ── Domain-Driven Mutators ──

    /** LOGIC: Patient updates contact info.
     *    First → set new email + phone.
     *    Then → bump updatedAt so the caller knows it changed.
     *    So → the entity is consistent: both fields change together. */
    public void updateContactInfo(String email, String phoneNumber) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.updatedAt = Instant.now();
    }

    /** LOGIC: Patient updates profile fields.
     *    First → set fullName, dateOfBirth, educationYears unconditionally.
     *    Then → for email and gender: if blank, set to null (DB nullable);
     *           otherwise trim whitespace so no accidental spaces.
     *    So → the entity stores clean values ready for save. */
    public void updateProfile(String fullName, String email, String gender,
                              LocalDate dateOfBirth, Integer educationYears) {
        this.fullName = fullName;
        this.email = email == null || email.isBlank() ? null : email.trim();
        this.gender = gender == null || gender.isBlank() ? null : gender.trim();
        this.dateOfBirth = dateOfBirth;
        this.educationYears = educationYears;
        this.updatedAt = Instant.now();
    }
}
