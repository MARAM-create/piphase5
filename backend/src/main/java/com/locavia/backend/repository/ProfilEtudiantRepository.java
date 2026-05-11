package com.locavia.backend.repository;

import com.locavia.backend.entity.ProfilEtudiant;
import com.locavia.backend.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfilEtudiantRepository extends JpaRepository<ProfilEtudiant, Long> {
    Optional<ProfilEtudiant> findByUtilisateur(Utilisateur utilisateur);
    Optional<ProfilEtudiant> findByUtilisateurId(Long id);

    @Query("SELECT p FROM ProfilEtudiant p WHERE p.vecteurPersonnalite IS NOT NULL AND p.utilisateur.id <> :utilisateurId")
    List<ProfilEtudiant> findAllWithEmbeddingExcept(@Param("utilisateurId") Long utilisateurId);
}