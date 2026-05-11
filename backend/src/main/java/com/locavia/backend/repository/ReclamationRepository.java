package com.locavia.backend.repository;

import com.locavia.backend.entity.Reclamation;
import com.locavia.backend.enums.ReclamationPriority;
import com.locavia.backend.enums.ReclamationStatus;
import com.locavia.backend.enums.ReclamationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

    List<Reclamation> findByStatus(ReclamationStatus status);

    List<Reclamation> findByType(ReclamationType type);

    List<Reclamation> findByPriority(ReclamationPriority priority);

    List<Reclamation> findByCategory(String category);

    long countByStatus(ReclamationStatus status);

    long countByPriority(ReclamationPriority priority);

    @Query("SELECT r.status, COUNT(r) FROM Reclamation r GROUP BY r.status")
    List<Object[]> getStatusDistribution();

    @Query("SELECT r.priority, COUNT(r) FROM Reclamation r WHERE r.priority IS NOT NULL GROUP BY r.priority")
    List<Object[]> getPriorityDistribution();

    @Query("SELECT r.category, COUNT(r) FROM Reclamation r WHERE r.category IS NOT NULL GROUP BY r.category")
    List<Object[]> getCategoryDistribution();
}
