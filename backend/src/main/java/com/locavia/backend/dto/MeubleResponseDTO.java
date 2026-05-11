package com.locavia.backend.dto;

import com.locavia.backend.enums.EtatMeuble;
import com.locavia.backend.enums.StatutMeuble;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class MeubleResponseDTO {
    private Long id;
    private String titre;
    private String description;
    private Double prix;
    private EtatMeuble etat;
    private StatutMeuble statut;
    private String categorie;
    private String ville;
    private List<String> photos;
    private LocalDateTime creeLe;

    // Infos vendeur
    private Long vendeurId;
    private String vendeurPrenom;
    private String vendeurNom;
    private String vendeurEmail;
    private String vendeurTelephone;
}