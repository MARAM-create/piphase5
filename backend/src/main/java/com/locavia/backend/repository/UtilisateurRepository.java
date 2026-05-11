package com.locavia.backend.repository;

import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.Statut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);
    boolean               existsByEmail(String email);
    Optional<Utilisateur> findByTokenVerificationEmail(String token);
    Optional<Utilisateur> findByTokenReinitMdp(String token);
    List<Utilisateur>     findByStatut(Statut statut);
    List<Utilisateur>     findByRole(Role role);
    long                  countByStatut(Statut statut);
    long                  countByRole(Role role);
}