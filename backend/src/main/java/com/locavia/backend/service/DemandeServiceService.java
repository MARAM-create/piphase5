package com.locavia.backend.service;

import com.locavia.backend.dto.DemandeServiceRequestDTO;
import com.locavia.backend.dto.DemandeServiceResponseDTO;
import com.locavia.backend.dto.DisponibiliteDTO;
import com.locavia.backend.dto.ProfilPrestataireResponseDTO;
import com.locavia.backend.entity.DemandeService;
import com.locavia.backend.entity.ProfilPrestataire;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.StatutDemande;
import com.locavia.backend.repository.DemandeServiceRepository;
import com.locavia.backend.repository.ProfilEtudiantRepository;
import com.locavia.backend.repository.ProfilPrestataireRepository;
import com.locavia.backend.repository.ProfilProprietaireRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DemandeServiceService {

    private final DemandeServiceRepository     demandeRepository;
    private final UtilisateurRepository        utilisateurRepository;
    private final ProfilPrestataireRepository  profilPrestataireRepository;
    private final ProfilEtudiantRepository     profilEtudiantRepository;
    private final ProfilProprietaireRepository profilProprietaireRepository;
    private final ServiceEmail                 serviceEmail;

    private Utilisateur getUtilisateurConnecte() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // ─── Ville utilisateur ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public String getVilleUtilisateur() {
        Utilisateur u = getUtilisateurConnecte();
        return switch (u.getRole()) {
            case ETUDIANT -> profilEtudiantRepository
                    .findByUtilisateurId(u.getId())
                    .map(p -> p.getVilleRecherche() != null
                            ? p.getVilleRecherche() : "")
                    .orElse("");
            case PROPRIETAIRE -> profilProprietaireRepository
                    .findByUtilisateurId(u.getId())
                    .map(p -> p.getVille() != null ? p.getVille() : "")
                    .orElse("");
            case PRESTATAIRE -> profilPrestataireRepository
                    .findByUtilisateurId(u.getId())
                    .map(p -> p.getZoneIntervention() != null
                            ? p.getZoneIntervention() : "")
                    .orElse("");
            default -> "";
        };
    }

    // ─── Adresse utilisateur ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public String getAdresseUtilisateur() {
        Utilisateur u = getUtilisateurConnecte();
        if (u.getRole() == Role.PROPRIETAIRE) {
            return profilProprietaireRepository
                    .findByUtilisateurId(u.getId())
                    .map(p -> p.getAdresse() != null ? p.getAdresse() : "")
                    .orElse("");
        }
        return "";
    }

    // ─── Liste prestataires ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProfilPrestataireResponseDTO> listerPrestataires() {
        Utilisateur connecte = getUtilisateurConnecte();
        List<ProfilPrestataire> profils = profilPrestataireRepository.findAll();
        List<ProfilPrestataireResponseDTO> result = new ArrayList<>();

        for (ProfilPrestataire p : profils) {
            if (p.getUtilisateur() == null) continue;
            result.add(toProfilDTO(p));
        }
        return result;
    }

    // ─── Disponibilités d'un prestataire ────────────────────────────
    @Transactional(readOnly = true)
    public List<DisponibiliteDTO> getDisponibilites(Long prestataireId) {
        return demandeRepository.findDisponibilites(prestataireId)
                .stream()
                .map(d -> {
                    DisponibiliteDTO dto = new DisponibiliteDTO();
                    dto.setDateService(d.getDateService());
                    dto.setHeureService(d.getHeureService());
                    dto.setStatut(d.getStatut());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ─── Envoyer une demande ─────────────────────────────────────────
    public DemandeServiceResponseDTO envoyerDemande(
            DemandeServiceRequestDTO dto) {
        Utilisateur demandeur   = getUtilisateurConnecte();
        Utilisateur prestataire = utilisateurRepository
                .findById(dto.getPrestataireId())
                .orElseThrow(() -> new RuntimeException("Prestataire non trouvé"));

        if (prestataire.getRole() != Role.PRESTATAIRE) {
            throw new RuntimeException(
                    "Cet utilisateur n'est pas un prestataire");
        }

        // Vérifier doublon (même date + heure + prestataire)
        demandeRepository.findDoublon(
                demandeur.getId(),
                prestataire.getId(),
                dto.getDateService(),
                dto.getHeureService(),
                StatutDemande.REFUSEE
        ).ifPresent(d -> {
            throw new RuntimeException(
                    "Une demande existe déjà pour cette date et heure "
                            + "avec ce prestataire");
        });

        String ville   = dto.getVille() != null && !dto.getVille().isBlank()
                ? dto.getVille() : getVilleUtilisateur();
        String adresse = dto.getAdresse() != null && !dto.getAdresse().isBlank()
                ? dto.getAdresse() : getAdresseUtilisateur();

        DemandeService demande = DemandeService.builder()
                .demandeur(demandeur)
                .prestataire(prestataire)
                .dateService(dto.getDateService())
                .heureService(dto.getHeureService())
                .probleme(dto.getProbleme())
                .adresse(adresse)
                .ville(ville)
                .statut(StatutDemande.EN_ATTENTE)
                .build();

        DemandeService saved = demandeRepository.save(demande);

        try {
            serviceEmail.envoyerEmailDemande(prestataire, demandeur, saved);
        } catch (Exception ignored) {}

        return toDTO(saved);
    }

    // ─── Modifier une demande (EN_ATTENTE uniquement) ────────────────
    public DemandeServiceResponseDTO modifierDemande(
            Long id, DemandeServiceRequestDTO dto) {
        Utilisateur demandeur = getUtilisateurConnecte();
        DemandeService demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (!demande.getDemandeur().getId().equals(demandeur.getId())) {
            throw new RuntimeException("Non autorisé");
        }

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RuntimeException(
                    "Impossible de modifier une demande déjà traitée");
        }

        // Vérifier doublon sauf cette demande
        demandeRepository.findDoublon(
                demandeur.getId(),
                demande.getPrestataire().getId(),
                dto.getDateService(),
                dto.getHeureService(),
                StatutDemande.REFUSEE
        ).ifPresent(d -> {
            if (!d.getId().equals(id)) {
                throw new RuntimeException(
                        "Une demande existe déjà pour cette date et heure");
            }
        });

        String ville   = dto.getVille() != null && !dto.getVille().isBlank()
                ? dto.getVille() : getVilleUtilisateur();
        String adresse = dto.getAdresse() != null && !dto.getAdresse().isBlank()
                ? dto.getAdresse() : getAdresseUtilisateur();

        demande.setDateService(dto.getDateService());
        demande.setHeureService(dto.getHeureService());
        demande.setProbleme(dto.getProbleme());
        demande.setAdresse(adresse);
        demande.setVille(ville);

        return toDTO(demandeRepository.save(demande));
    }

    // ─── Supprimer une demande (EN_ATTENTE uniquement) ───────────────
    public void supprimerDemande(Long id) {
        Utilisateur demandeur = getUtilisateurConnecte();
        DemandeService demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (!demande.getDemandeur().getId().equals(demandeur.getId())) {
            throw new RuntimeException("Non autorisé");
        }

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RuntimeException(
                    "Impossible de supprimer une demande déjà traitée");
        }

        // Notifier le prestataire
        try {
            serviceEmail.envoyerEmailAnnulationDemande(
                    demande.getPrestataire(), demandeur, demande);
        } catch (Exception ignored) {}

        demandeRepository.delete(demande);
    }

    // ─── Toutes les demandes (admin) ────────────────────────────────
    @Transactional(readOnly = true)
    public List<DemandeServiceResponseDTO> toutesLesDemandes() {
        return demandeRepository.findAllOrderByCreeLePlanDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Mes demandes ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DemandeServiceResponseDTO> mesDemandes() {
        Utilisateur u = getUtilisateurConnecte();
        return demandeRepository
                .findByDemandeurIdOrderByCreeLePlanDesc(u.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Demandes reçues (prestataire) ──────────────────────────────
    @Transactional(readOnly = true)
    public List<DemandeServiceResponseDTO> demandesRecues() {
        Utilisateur u = getUtilisateurConnecte();
        return demandeRepository
                .findByPrestataireIdOrderByDateServiceAsc(u.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Détail ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public DemandeServiceResponseDTO getDetail(Long id) {
        DemandeService d = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        return toDTO(d);
    }

    // ─── Accepter ────────────────────────────────────────────────────
    @Transactional
    public DemandeServiceResponseDTO accepterDemande(Long id) {
        Utilisateur prestataire = getUtilisateurConnecte();
        DemandeService demande  = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (!demande.getPrestataire().getId().equals(prestataire.getId())) {
            throw new RuntimeException("Non autorisé");
        }

        StatutDemande ancienStatut = demande.getStatut();
        demande.setStatut(StatutDemande.ACCEPTEE);
        DemandeService saved = demandeRepository.save(demande);

        // Mail changement d'avis (refusé → accepté)
        try {
            if (ancienStatut == StatutDemande.REFUSEE) {
                serviceEmail.envoyerEmailChangementAvisAcceptation(
                        demande.getDemandeur(), prestataire, demande);
            }
        } catch (Exception ignored) {}

        return toDTO(saved);
    }

    // ─── Refuser ─────────────────────────────────────────────────────
    @Transactional
    public DemandeServiceResponseDTO refuserDemande(Long id) {
        Utilisateur prestataire = getUtilisateurConnecte();
        DemandeService demande  = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (!demande.getPrestataire().getId().equals(prestataire.getId())) {
            throw new RuntimeException("Non autorisé");
        }

        StatutDemande ancienStatut = demande.getStatut();
        demande.setStatut(StatutDemande.REFUSEE);
        DemandeService saved = demandeRepository.save(demande);

        // Mail changement d'avis (accepté → refusé)
        try {
            if (ancienStatut == StatutDemande.ACCEPTEE) {
                serviceEmail.envoyerEmailChangementAvisRefus(
                        demande.getDemandeur(), prestataire, demande);
            }
        } catch (Exception ignored) {}

        return toDTO(saved);
    }

    // ─── Mappers ─────────────────────────────────────────────────────
    private DemandeServiceResponseDTO toDTO(DemandeService d) {
        DemandeServiceResponseDTO dto = new DemandeServiceResponseDTO();
        dto.setId(d.getId());
        dto.setDateService(d.getDateService());
        dto.setHeureService(d.getHeureService());
        dto.setProbleme(d.getProbleme());
        dto.setAdresse(d.getAdresse());
        dto.setVille(d.getVille());
        dto.setStatut(d.getStatut());
        dto.setCreeLe(d.getCreeLe());

        if (d.getDemandeur() != null) {
            dto.setDemandeurId(d.getDemandeur().getId());
            dto.setDemandeurPrenom(d.getDemandeur().getPrenom());
            dto.setDemandeurNom(d.getDemandeur().getNom());
            dto.setDemandeurEmail(d.getDemandeur().getEmail());
            dto.setDemandeurTelephone(d.getDemandeur().getTelephone());
        }

        if (d.getPrestataire() != null) {
            dto.setPrestataireId(d.getPrestataire().getId());
            dto.setPrestatairePrenom(d.getPrestataire().getPrenom());
            dto.setPrestataireNom(d.getPrestataire().getNom());
            dto.setPrestataireEmail(d.getPrestataire().getEmail());
            dto.setPrestataireTelephone(d.getPrestataire().getTelephone());
            try {
                profilPrestataireRepository
                        .findByUtilisateurId(d.getPrestataire().getId())
                        .ifPresent(p -> dto.setPrestataireSpecialite(
                                p.getSpecialite()));
            } catch (Exception ignored) {}
        }
        return dto;
    }

    private ProfilPrestataireResponseDTO toProfilDTO(ProfilPrestataire p) {
        ProfilPrestataireResponseDTO dto = new ProfilPrestataireResponseDTO();
        Utilisateur u = p.getUtilisateur();
        dto.setUtilisateurId(u.getId());
        dto.setPrenom(u.getPrenom() != null ? u.getPrenom() : "");
        dto.setNom(u.getNom() != null ? u.getNom() : "");
        dto.setEmail(u.getEmail() != null ? u.getEmail() : "");
        dto.setTelephone(u.getTelephone() != null ? u.getTelephone() : "");
        dto.setPhotoProfil(u.getPhotoProfil() != null ? u.getPhotoProfil() : "");
        dto.setSpecialite(p.getSpecialite() != null ? p.getSpecialite() : "");
        dto.setExperienceAnnees(
                p.getExperienceAnnees() != null ? p.getExperienceAnnees() : 0);
        dto.setCertifications(
                p.getCertifications() != null ? p.getCertifications() : "");
        dto.setZoneIntervention(
                p.getZoneIntervention() != null ? p.getZoneIntervention() : "");
        dto.setTarifHoraire(
                p.getTarifHoraire() != null ? p.getTarifHoraire() : 0.0);
        dto.setDisponibilite(
                p.getDisponibilite() != null ? p.getDisponibilite() : "");
        dto.setSiteWeb(p.getSiteWeb() != null ? p.getSiteWeb() : "");
        dto.setVille(
                p.getZoneIntervention() != null ? p.getZoneIntervention() : "");
        return dto;
    }
}