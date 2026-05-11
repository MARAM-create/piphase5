package com.locavia.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReponseMatchColocataireDTO {
    
    private Long utilisateurId;
    private String nom;
    private String prenom;
    private String photoProfil;
    private Integer age;
    
    // Informations académiques
    private String universite;
    private String filiere;
    
    // Localisation et budget
    private String villeRecherche;
    private Double budgetMax;
    
    // Score de compatibilité (0-100%)
    private int scoreCompatibilite;
    
    // Détails du profil
    private List<String> hobbies;
    private String descriptionPersonnelle;
    
    // Points communs avec l'utilisateur connecté (pour affichage UI)
    private List<String> pointsCommuns;
}
