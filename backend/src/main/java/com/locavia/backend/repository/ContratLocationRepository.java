package com.locavia.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.locavia.backend.entity.ContratLocation;
import com.locavia.backend.enums.IAValidationStatus;
import com.locavia.backend.enums.StatutContrat;
import com.locavia.backend.enums.StatutIa;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContratLocationRepository extends JpaRepository<ContratLocation, Long> {

    // ✅ Dans Utilisateur c'est 'id'
    List<ContratLocation> findByLocataire_Id(Long locataireId);

    // ✅ Dans Utilisateur c'est 'id'
    List<ContratLocation> findByBailleur_Id(Long bailleurId);

    List<ContratLocation> findByStatutContrat(StatutContrat statutContrat);

    List<ContratLocation> findByStatutIa(StatutIa statutIa);

    // ✅ Dans DemandeLocation c'est 'idDemande'
    Optional<ContratLocation> findByDemande_IdDemande(Long demandeId);

    // ✅ Dans DemandeLocation c'est 'idDemande'
    boolean existsByDemande_IdDemande(Long demandeId);

    // ✅ Dans AnnonceLocation c'est 'idAnnonce'
    List<ContratLocation> findByAnnonce_IdAnnonce(Long annonceId);

    List<ContratLocation> findByProchainPaiementBetween(LocalDateTime debut, LocalDateTime fin);

    List<ContratLocation> findByImageScanneUrlIsNotNullAndIaValidationStatus(IAValidationStatus iaValidationStatus);

    // ✅ Contrats actifs pour un bailleur spécifique
    List<ContratLocation> findByBailleur_IdAndStatutContrat(Long bailleurId, StatutContrat statutContrat);
}