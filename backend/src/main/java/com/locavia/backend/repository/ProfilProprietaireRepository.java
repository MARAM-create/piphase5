package com.locavia.backend.repository;

import com.locavia.backend.entity.ProfilProprietaire;
import com.locavia.backend.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfilProprietaireRepository extends JpaRepository<ProfilProprietaire, Long> {
    Optional<ProfilProprietaire> findByUtilisateur(Utilisateur utilisateur);
    Optional<ProfilProprietaire> findByUtilisateurId(Long id);
}