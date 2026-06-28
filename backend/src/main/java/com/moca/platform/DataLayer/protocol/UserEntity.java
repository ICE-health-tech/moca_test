package com.moca.platform.DataLayer.protocol;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "users", schema = "public")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Optional and unique
    @Column(name = "email", unique = true)
    private String email;

    // Optional and unique
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

    // Protected constructor for JPA compliance
    protected UserEntity() {
    }

    // Comprehensive constructor
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

    // --- Getters ---
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public UserRole getRole() { return role; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
    public Integer getEducationYears() { return educationYears; }
    public String getGender() { return gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    // --- Domain-Driven Mutators ---
    public void updateContactInfo(String email, String phoneNumber) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.updatedAt = Instant.now();
    }

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