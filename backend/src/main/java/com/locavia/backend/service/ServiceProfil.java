package com.locavia.backend.service;


import com.locavia.backend.dto.ProfilEtudiantDTO;
import com.locavia.backend.dto.ProfilPrestataireDTO;
import com.locavia.backend.dto.ProfilProprietaireDTO;
import com.locavia.backend.entity.ProfilEtudiant;
import com.locavia.backend.entity.ProfilPrestataire;
import com.locavia.backend.entity.ProfilProprietaire;
import com.locavia.backend.entity.Utilisateur;

import com.locavia.backend.dto.*;
import com.locavia.backend.entity.*;
import com.locavia.backend.enums.Role;
import com.locavia.backend.exception.ExceptionMetier;
import com.locavia.backend.repository.ProfilEtudiantRepository;
import com.locavia.backend.repository.ProfilPrestataireRepository;
import com.locavia.backend.repository.ProfilProprietaireRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceProfil {

    private final UtilisateurRepository utilisateurRepo;
    private final ProfilEtudiantRepository profilEtudiantRepo;
    private final ProfilProprietaireRepository profilProprietaireRepo;
    private final ProfilPrestataireRepository profilPrestataireRepo;

    // ── Étudiant ─────────────────────────────────────────────
    public ProfilEtudiantDTO obtenirProfilEtudiant(String email) {
        Utilisateur u = trouverParEmail(email);
        return profilEtudiantRepo.findByUtilisateurId(u.getId())
                .map(this::toDTOEtudiant)
                .orElse(new ProfilEtudiantDTO());
    }

    public ProfilEtudiantDTO sauvegarderProfilEtudiant(
            String email, ProfilEtudiantDTO dto) {

        Utilisateur u = trouverParEmail(email);
        verifierRole(u, Role.ETUDIANT);

        ProfilEtudiant profil = profilEtudiantRepo
                .findByUtilisateurId(u.getId())
                .orElse(ProfilEtudiant.builder().utilisateur(u).build());

        if (dto.getUniversite() != null) profil.setUniversite(dto.getUniversite());
        if (dto.getFiliere() != null) profil.setFiliere(dto.getFiliere());
        if (dto.getNiveauEtude() != null) profil.setNiveauEtude(dto.getNiveauEtude());
        if (dto.getAnneeDiplome() != null) profil.setAnneeDiplome(dto.getAnneeDiplome());
        if (dto.getNumeroEtudiant() != null) profil.setNumeroEtudiant(dto.getNumeroEtudiant());
        if (dto.getVilleRecherche() != null) profil.setVilleRecherche(dto.getVilleRecherche());
        if (dto.getBudgetMax() != null) profil.setBudgetMax(dto.getBudgetMax());
        if (dto.getTypeLogement() != null) profil.setTypeLogement(dto.getTypeLogement());

        return toDTOEtudiant(profilEtudiantRepo.save(profil));
    }

    // ── Propriétaire ─────────────────────────────────────────
    public ProfilProprietaireDTO obtenirProfilProprietaire(String email) {
        try {
            Utilisateur u = trouverParEmail(email);
            return profilProprietaireRepo.findByUtilisateurId(u.getId())
                    .map(this::toDTOProprietaire)
                    .orElse(new ProfilProprietaireDTO());
        } catch (Exception e) {
            System.err.println("Erreur lors de l'obtention du profil propriétaire: " + e.getMessage());
            return new ProfilProprietaireDTO();
        }
    }

    public ProfilProprietaireDTO sauvegarderProfilProprietaire(
            String email, ProfilProprietaireDTO dto) {

        Utilisateur u = trouverParEmail(email);
        verifierRole(u, Role.PROPRIETAIRE);

        ProfilProprietaire profil = profilProprietaireRepo
                .findByUtilisateurId(u.getId())
                .orElse(ProfilProprietaire.builder().utilisateur(u).build());

        if (dto.getAdresse() != null) profil.setAdresse(dto.getAdresse());
        if (dto.getVille() != null) profil.setVille(dto.getVille());
        if (dto.getCodePostal() != null) profil.setCodePostal(dto.getCodePostal());
        if (dto.getNumeroFiscal() != null) profil.setNumeroFiscal(dto.getNumeroFiscal());
        if (dto.getNbProprietes() != null) profil.setNbProprietes(dto.getNbProprietes());
        if (dto.getTypeBien() != null) profil.setTypeBien(dto.getTypeBien());
        if (dto.getDescriptionBiens() != null) profil.setDescriptionBiens(dto.getDescriptionBiens());

        return toDTOProprietaire(profilProprietaireRepo.save(profil));
    }

    // ── Prestataire ──────────────────────────────────────────
    public ProfilPrestataireDTO obtenirProfilPrestataire(String email) {
        Utilisateur u = trouverParEmail(email);
        return profilPrestataireRepo.findByUtilisateurId(u.getId())
                .map(this::toDTOPrestataire)
                .orElse(new ProfilPrestataireDTO());
    }

    public ProfilPrestataireDTO sauvegarderProfilPrestataire(
            String email, ProfilPrestataireDTO dto) {

        Utilisateur u = trouverParEmail(email);
        verifierRole(u, Role.PRESTATAIRE);

        ProfilPrestataire profil = profilPrestataireRepo
                .findByUtilisateurId(u.getId())
                .orElse(ProfilPrestataire.builder().utilisateur(u).build());

        if (dto.getSpecialite() != null) profil.setSpecialite(dto.getSpecialite());
        if (dto.getExperienceAnnees() != null) profil.setExperienceAnnees(dto.getExperienceAnnees());
        if (dto.getCertifications() != null) profil.setCertifications(dto.getCertifications());
        if (dto.getZoneIntervention() != null) profil.setZoneIntervention(dto.getZoneIntervention());
        if (dto.getTarifHoraire() != null) profil.setTarifHoraire(dto.getTarifHoraire());
        if (dto.getDisponibilite() != null) profil.setDisponibilite(dto.getDisponibilite());
        if (dto.getSiteWeb() != null) profil.setSiteWeb(dto.getSiteWeb());

        return toDTOPrestataire(profilPrestataireRepo.save(profil));
    }

    // ── Helpers ──────────────────────────────────────────────
    private Utilisateur trouverParEmail(String email) {
        return utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur introuvable"));
    }

    private void verifierRole(Utilisateur u, Role role) {
        if (u.getRole() != role) {
            throw new ExceptionMetier("Accès non autorisé pour ce rôle");
        }
    }

    private ProfilEtudiantDTO toDTOEtudiant(ProfilEtudiant p) {
        return ProfilEtudiantDTO.builder()
                .id(p.getId())
                .universite(p.getUniversite())
                .filiere(p.getFiliere())
                .niveauEtude(p.getNiveauEtude())
                .anneeDiplome(p.getAnneeDiplome())
                .numeroEtudiant(p.getNumeroEtudiant())
                .villeRecherche(p.getVilleRecherche())
                .budgetMax(p.getBudgetMax())
                .typeLogement(p.getTypeLogement())
                .build();
    }

    private ProfilProprietaireDTO toDTOProprietaire(ProfilProprietaire p) {
        return ProfilProprietaireDTO.builder()
                .id(p.getId())
                .adresse(p.getAdresse())
                .ville(p.getVille())
                .codePostal(p.getCodePostal())
                .numeroFiscal(p.getNumeroFiscal())
                .nbProprietes(p.getNbProprietes())
                .typeBien(p.getTypeBien())
                .descriptionBiens(p.getDescriptionBiens())
                .build();
    }

    private ProfilPrestataireDTO toDTOPrestataire(ProfilPrestataire p) {
        return ProfilPrestataireDTO.builder()
                .id(p.getId())
                .specialite(p.getSpecialite())
                .experienceAnnees(p.getExperienceAnnees())
                .certifications(p.getCertifications())
                .zoneIntervention(p.getZoneIntervention())
                .tarifHoraire(p.getTarifHoraire())
                .disponibilite(p.getDisponibilite())
                .siteWeb(p.getSiteWeb())
                .build();
    }
}