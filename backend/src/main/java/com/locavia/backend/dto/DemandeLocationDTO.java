package com.locavia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class DemandeLocationDTO {
    private Long idDemande;
    private LocalDateTime dateDemande;
    private String messageCandidat;
    private String statutDemande;
    private Integer nombrePersonnes;
    private Boolean archive;

    private Long annonceId;
    private String annonceTitre;
    private String annonceAdresse;
    private String annonceVille;

    private Long conversationId;
}
