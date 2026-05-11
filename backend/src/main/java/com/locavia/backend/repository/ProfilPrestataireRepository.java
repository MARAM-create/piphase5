package com.locavia.backend.repository;

import com.locavia.backend.entity.ProfilPrestataire;
import com.locavia.backend.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfilPrestataireRepository extends JpaRepository<ProfilPrestataire, Long> {

    Optional<ProfilPrestataire> findByUtilisateur(Utilisateur utilisateur);

    Optional<ProfilPrestataire> findByUtilisateurId(Long id);
}