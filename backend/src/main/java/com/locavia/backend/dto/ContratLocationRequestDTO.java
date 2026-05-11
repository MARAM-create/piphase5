package com.locavia.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO de création d'un contrat.
 * Contient les IDs nécessaires pour établir les relations
 * ainsi que les dates de début et de fin du contrat.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratLocationRequestDTO {

    @NotNull(message = "L'ID de la demande est obligatoire")
    private Long demandeId;

    @NotNull(message = "L'ID du locataire est obligatoire")
    private Long locataireId;

    @NotNull(message = "L'ID du bailleur est obligatoire")
    private Long bailleurId;

    @NotNull(message = "L'ID de l'annonce est obligatoire")
    private Long annonceId;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;
}

