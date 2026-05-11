package com.locavia.backend.dto;

import lombok.Data;
import com.locavia.backend.enums.StatutDemande;

@Data
public class ProfilPrestataireResponseDTO {
    private Long utilisateurId;
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String photoProfil;
    private String specialite;
    private Integer experienceAnnees;
    private String certifications;
    private String zoneIntervention;
    private Double tarifHoraire;
    private String disponibilite;
    private String siteWeb;
    private String ville;
    // Pour savoir si l'utilisateur a déjà une demande EN_ATTENTE vers ce prestataire
    private StatutDemande statutDemande; // null si aucune demande
    private Long demandeId; // null si aucune demande
}