package com.locavia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ConversationResumeDTO {
    private Long id;
    private Boolean estActive;

    private Long demandeId;
    private Long annonceId;
    private String titreAnnonce;

    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantPhotoProfil;

    private Long proprietaireId;
    private String proprietaireNom;
    private String proprietairePrenom;
    private String proprietairePhotoProfil;

    private String statutDemande;

    private String dernierMessage;
    private LocalDateTime dateDernierMessage;

    private Boolean bloque;
    private Long bloqueParId;
    private String annonceImageUrl;
}
