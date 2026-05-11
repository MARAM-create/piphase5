package com.locavia.backend.dto;

import com.locavia.backend.enums.StatutDemande;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class DemandeServiceResponseDTO {
    private Long id;
    private LocalDate dateService;
    private LocalTime heureService;
    private String probleme;
    private String adresse;
    private String ville;
    private StatutDemande statut;
    private LocalDateTime creeLe;

    // Infos demandeur
    private Long demandeurId;
    private String demandeurPrenom;
    private String demandeurNom;
    private String demandeurEmail;
    private String demandeurTelephone;

    // Infos prestataire
    private Long prestataireId;
    private String prestatairePrenom;
    private String prestataireNom;
    private String prestataireEmail;
    private String prestataireTelephone;
    private String prestataireSpecialite;
}