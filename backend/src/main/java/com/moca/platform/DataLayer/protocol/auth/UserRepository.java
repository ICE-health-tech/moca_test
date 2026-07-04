package com.moca.platform.DataLayer.protocol.auth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    long countByRole(UserRole role);

    @Query("""
            SELECT u FROM UserEntity u
            WHERE u.role = com.moca.platform.DataLayer.protocol.auth.UserRole.DOCTOR
            ORDER BY u.fullName
            """)
    List<UserEntity> findAllDoctors();
}
