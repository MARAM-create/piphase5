package com.locavia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.locavia.backend.enums.StatutContrat;
import com.locavia.backend.enums.StatutIa;
import com.locavia.backend.enums.IAValidationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour un contrat.
 * Contient les champs propres du contrat + les IDs/noms des entités liées
 * pour garder le payload léger et éviter la récursion infinie.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratLocationResponseDTO {

    private Long id;

    // ── Identifiants des entités liées ────────────────────────

    private Long demandeId;

    private Long locataireId;
    private String locataireFullName;

    private Long bailleurId;
    private String bailleurFullName;

    private Long annonceId;
    private String annonceTitre;

    // ── Champs métier ────────────────────────────────────────

    private String pdfViergeUrl;
    private String imageScanneUrl;
    private IAValidationStatus iaValidationStatus;
    private StatutIa statutIa;
    private StatutContrat statutContrat;
    private String raisonIa;

    // ── Calendrier de paiement ────────────────────────────────

    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalDateTime prochainPaiement;
}

