package com.locavia.backend.service;

import com.locavia.backend.dto.UtilisateurDTO;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.Statut;
import com.locavia.backend.exception.ExceptionMetier;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
@Service
@RequiredArgsConstructor
@Transactional
public class ServiceAdmin {

    private final UtilisateurRepository utilisateurRepository;
    private final ServiceEmail          serviceEmail;
    private final ServiceAuth           serviceAuth;

    @Transactional(readOnly = true)
    public List<UtilisateurDTO> getUtilisateursEnAttente() {
        return utilisateurRepository
                .findByStatut(Statut.EN_ATTENTE_ADMIN)
                .stream()
                .map(serviceAuth::versDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UtilisateurDTO> getTousLesUtilisateurs() {
        return utilisateurRepository.findAll()
                .stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .map(serviceAuth::versDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UtilisateurDTO> getUtilisateursParRole(Role role) {
        return utilisateurRepository.findByRole(role)
                .stream()
                .map(serviceAuth::versDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistiques() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total",         utilisateurRepository.count() - 1);
        stats.put("enAttente",     utilisateurRepository.countByStatut(Statut.EN_ATTENTE_ADMIN));
        stats.put("actifs",        utilisateurRepository.countByStatut(Statut.ACTIF));
        stats.put("bannis",        utilisateurRepository.countByStatut(Statut.BANNI));
        stats.put("rejetes",       utilisateurRepository.countByStatut(Statut.REJETE));
        stats.put("etudiants",     utilisateurRepository.countByRole(Role.ETUDIANT));
        stats.put("proprietaires", utilisateurRepository.countByRole(Role.PROPRIETAIRE));
        stats.put("prestataires",  utilisateurRepository.countByRole(Role.PRESTATAIRE));
        return stats;
    }

    public void approuverUtilisateur(Long id) {
        Utilisateur u = trouverParId(id);
        u.setStatut(Statut.ACTIF);
        utilisateurRepository.save(u);
        serviceEmail.envoyerEmailApprobation(u);
    }

    public void rejeterUtilisateur(Long id) {
        Utilisateur u = trouverParId(id);
        u.setStatut(Statut.REJETE);
        utilisateurRepository.save(u);
        serviceEmail.envoyerEmailRejet(u);
    }

    public void bannirUtilisateur(Long id) {
        Utilisateur u = trouverParId(id);
        if (u.getRole() == Role.ADMIN) {
            throw new ExceptionMetier("Impossible de bannir un administrateur");
        }
        u.setStatut(Statut.BANNI);
        utilisateurRepository.save(u);
    }

    public void debannirUtilisateur(Long id) {
        Utilisateur u = trouverParId(id);
        u.setStatut(Statut.ACTIF);
        utilisateurRepository.save(u);
    }

    private Utilisateur trouverParId(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur introuvable"));
    }
}