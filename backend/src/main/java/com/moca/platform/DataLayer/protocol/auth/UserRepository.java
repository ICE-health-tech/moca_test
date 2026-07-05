package com.moca.platform.DataLayer.protocol.auth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    long countByRole(UserRole role);

    List<UserEntity> findByRoleOrderByFullNameAsc(UserRole role);

    default List<UserEntity> findAllDoctors() {
        return findByRoleOrderByFullNameAsc(UserRole.DOCTOR);
    }
}
