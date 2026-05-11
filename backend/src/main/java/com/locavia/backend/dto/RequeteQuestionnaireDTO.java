package com.locavia.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class RequeteQuestionnaireDTO {
    
    // Informations académiques
    private String universite;
    private String filiere;
    private String niveauEtude;
    
    // Présentation personnelle
    private String descriptionPersonnelle;
    private List<String> hobbies;
    
    // Habitudes de vie
    private String horaireType;              // "matinal", "nocturne", "flexible"
    private String niveauProprete;           // "tres_organise", "moyen", "relaxe"
    private String frequenceInvites;         // "jamais", "occasionnel", "souvent"
    
    // Préférences fumeur/animaux
    private Boolean fumeur;                    // L'utilisateur fume-t-il ?
    private Boolean accepteFumeur;
    private Boolean aAnimaux;
    private Boolean accepteAnimaux;
    
    // Critères de recherche colocataire
    private String villeRecherche;
    private Double budgetMax;
    private Double budgetMaxColocation;
    private String villeRechercheColocation;
    
    // Préférences colocataire
    private String trancheAgeRecherche;      // "18-22", "23-27", "28-35"
    private String sexePrefere;              // "homme", "femme", "indifferent"
    private Boolean memeUniversitePrefere;
}
