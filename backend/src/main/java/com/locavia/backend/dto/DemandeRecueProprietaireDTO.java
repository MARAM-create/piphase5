package com.locavia.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class DemandeRecueProprietaireDTO {
    private Long idDemande;
    private LocalDateTime dateDemande;
    private String statutDemande;

    // Étudiant
    private Long etudiantId;
    private String prenomEtudiant;
    private String nomEtudiant;
    private String emailEtudiant;
    private String telephoneEtudiant;

    // Annonce
    private Long annonceId;
    private String annonceTitre;
    private String annonceAdresse;
    private String annonceVille;

    // Besoin locatif
    private Integer nombrePersonnes;
    private LocalDate dateEntree;
    private String dureeLocation;
    private Double budget;
    private String villeActuelle;
    private String criterePrincipal;
    private String besoinPrincipal;
    private String remarqueLogement;

    // Visite
    private String typeVisite;
    private String formatVisite;
    private String momentVisite;

    // Disponibilités
    private LocalDate dateSouhaitee;
    private String joursDisponibles;
    private String plageHoraire;
    private String remarqueDisponibilite;

    // Message final
    private String messageCandidat;


    private String statutVisiteDirect;
    private String statutVisiteVideo;
    private Boolean directCree;
    private Boolean videoCree;

    // Lecture / gestion
    private Boolean archive;
    private Boolean supprime;


}
