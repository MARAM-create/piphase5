package com.locavia.backend.repository;

import com.locavia.backend.entity.DemandeService;
import com.locavia.backend.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeServiceRepository extends JpaRepository<DemandeService, Long> {

    @Query("SELECT d FROM DemandeService d WHERE d.demandeur.id = :id ORDER BY d.creeLe DESC")
    List<DemandeService> findByDemandeurIdOrderByCreeLePlanDesc(@Param("id") Long id);

    @Query("SELECT d FROM DemandeService d WHERE d.prestataire.id = :id ORDER BY d.dateService ASC")
    List<DemandeService> findByPrestataireIdOrderByDateServiceAsc(@Param("id") Long id);

    // Vérifier doublon exact
    @Query("""
        SELECT d FROM DemandeService d
        WHERE d.demandeur.id = :demandeurId
        AND d.prestataire.id = :prestataireId
        AND d.dateService = :date
        AND d.heureService = :heure
        AND d.statut != :statut
    """)
    Optional<DemandeService> findDoublon(
            @Param("demandeurId") Long demandeurId,
            @Param("prestataireId") Long prestataireId,
            @Param("date") LocalDate date,
            @Param("heure") LocalTime heure,
            @Param("statut") StatutDemande statut
    );

    @Query("SELECT d FROM DemandeService d ORDER BY d.creeLe DESC")
    List<DemandeService> findAllOrderByCreeLePlanDesc();

    // Disponibilités d'un prestataire (EN_ATTENTE + ACCEPTEE)
    @Query("""
        SELECT d FROM DemandeService d
        WHERE d.prestataire.id = :prestataireId
        AND d.statut IN ('EN_ATTENTE', 'ACCEPTEE')
        ORDER BY d.dateService ASC
    """)
    List<DemandeService> findDisponibilites(@Param("prestataireId") Long prestataireId);
}