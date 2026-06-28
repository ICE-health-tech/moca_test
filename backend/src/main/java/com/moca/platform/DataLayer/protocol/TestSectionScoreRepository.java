package com.moca.platform.DataLayer.protocol;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestSectionScoreRepository extends JpaRepository<TestSectionScoreEntity, UUID> {

    List<TestSectionScoreEntity> findBySessionIdOrderBySectionKeyAsc(UUID sessionId);

    Optional<TestSectionScoreEntity> findBySessionIdAndSectionKey(UUID sessionId, String sectionKey);
}
