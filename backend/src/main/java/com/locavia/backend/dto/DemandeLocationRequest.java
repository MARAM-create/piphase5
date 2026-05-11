package com.locavia.backend.dto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DemandeLocationRequest {

    private Long annonceId;
    private Long etudiantId;

    private String messageCandidat;
    private Integer nombrePersonnes;

    private String dateEntree;
    private String dureeLocation;
    private Double budget;
    private String villeActuelle;
    private String criterePrincipal;
    private String besoinPrincipal;
    private String remarqueLogement;

    private String typeVisite;
    private String formatVisite;
    private String momentVisite;

    private String dateSouhaitee;
    private String joursDisponibles;
    private String plageHoraire;
    private String remarqueDisponibilite;
}
