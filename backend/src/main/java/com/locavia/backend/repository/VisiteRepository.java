package com.locavia.backend.repository;

import com.locavia.backend.entity.Visite;
import com.locavia.backend.enums.ModeVisite;
import com.locavia.backend.enums.StatutVisite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VisiteRepository extends JpaRepository<Visite, Long>{

        Optional<Visite> findByDemandeIdDemande(Long demandeId);

        Optional<Visite> findByDemandeIdDemandeAndModeVisite(Long demandeId, ModeVisite modeVisite);

        List<Visite> findAllByDemandeIdDemande(Long demandeId);

        List<Visite> findByProprietaireIdOrderByCreatedAtDesc(Long proprietaireId);

        List<Visite> findByEtudiantIdOrderByCreatedAtDesc(Long etudiantId);

        List<Visite> findByAnnonceIdAnnonceOrderByCreatedAtDesc(Long annonceId);

        List<Visite> findByStatutVisite(StatutVisite statutVisite);
    }

