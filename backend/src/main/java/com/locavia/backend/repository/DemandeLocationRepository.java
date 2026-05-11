package com.locavia.backend.repository;
import com.locavia.backend.entity.DemandeLocation;
import com.locavia.backend.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface DemandeLocationRepository  extends JpaRepository<DemandeLocation, Long> {
    List<DemandeLocation> findByEtudiantId(Long etudiantId);

    @Query("SELECT d FROM DemandeLocation d WHERE d.annonce.idAnnonce = :annonceId")
    List<DemandeLocation> findByAnnonceId(@Param("annonceId") Long annonceId);

    List<DemandeLocation> findByStatutDemande(StatutDemande statut);

    @Query("SELECT d FROM DemandeLocation d WHERE d.etudiant.id = :etudiantId ORDER BY d.dateDemande DESC")
    List<DemandeLocation> findDerniereDemandeByEtudiant(@Param("etudiantId") Long etudiantId);

    boolean existsByEtudiantIdAndAnnonceIdAnnonce(Long etudiantId, Long annonceId);
    List<DemandeLocation> findByEtudiantIdAndArchiveFalse(Long etudiantId);

    List<DemandeLocation> findByEtudiantIdAndArchiveTrue(Long etudiantId);

    @Query("SELECT d FROM DemandeLocation d WHERE d.etudiant.id = :etudiantId AND COALESCE(d.archive, false) = false AND COALESCE(d.supprime, false) = false ORDER BY d.dateDemande DESC")
    List<DemandeLocation> findByEtudiantIdAndArchiveFalseAndSupprimeFalse(@Param("etudiantId") Long etudiantId);

    @Query("SELECT d FROM DemandeLocation d WHERE d.etudiant.id = :etudiantId AND d.archive = true AND COALESCE(d.supprime, false) = false ORDER BY d.dateDemande DESC")
    List<DemandeLocation> findByEtudiantIdAndArchiveTrueAndSupprimeFalse(@Param("etudiantId") Long etudiantId);

    @Query("SELECT d FROM DemandeLocation d WHERE d.annonce.proprietaire.id = :proprietaireId AND COALESCE(d.supprime, false) = false ORDER BY d.dateDemande DESC")
    List<DemandeLocation> findByAnnonceProprietaireIdAndSupprimeFalse(@Param("proprietaireId") Long proprietaireId);
}
