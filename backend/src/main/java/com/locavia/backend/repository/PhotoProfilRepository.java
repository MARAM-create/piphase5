package com.locavia.backend.repository;

import com.locavia.backend.entity.PhotoProfil;
import com.locavia.backend.entity.ProfilEtudiant;
import com.locavia.backend.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhotoProfilRepository extends JpaRepository<PhotoProfil, Long> {
    Optional<PhotoProfil> findByUtilisateurEmail(String email);
    Optional<ProfilEtudiant> findByUtilisateur(Utilisateur utilisateur);
    Optional<ProfilEtudiant> findByUtilisateurId(Long id);
}
