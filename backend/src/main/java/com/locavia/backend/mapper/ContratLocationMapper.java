package com.locavia.backend.mapper;

import org.springframework.stereotype.Component;
import com.locavia.backend.dto.ContratLocationResponseDTO;
import com.locavia.backend.entity.ContratLocation;

/**
 * Mapper manuel pour la conversion Entity <-> DTO.
 * La méthode toEntity n'est pas ici car c'est le Service
 * qui gère la résolution des IDs vers les entités JPA.
 */
@Component
public class ContratLocationMapper {

    /**
     * Convertit une entité ContratLocation en ResponseDTO
     * en extrayant les IDs et noms d'affichage des entités liées.
     */
    public ContratLocationResponseDTO toResponseDTO(ContratLocation entity) {
        return ContratLocationResponseDTO.builder()
                .id(entity.getId())
                // Relations
                .demandeId(entity.getDemande() != null ? entity.getDemande().getIdDemande() : null)
                .locataireId(entity.getLocataire() != null ? entity.getLocataire().getId() : null)
                .locataireFullName(entity.getLocataire() != null ? entity.getLocataire().getPrenom() + " " + entity.getLocataire().getNom() : null)
                .bailleurId(entity.getBailleur() != null ? entity.getBailleur().getId() : null)
                .bailleurFullName(entity.getBailleur() != null ? entity.getBailleur().getPrenom() + " " + entity.getBailleur().getNom() : null)
                .annonceId(entity.getAnnonce() != null ? entity.getAnnonce().getIdAnnonce() : null)
                .annonceTitre(entity.getAnnonce() != null ? entity.getAnnonce().getTitre() : null)
                // Champs métier
                .pdfViergeUrl(entity.getPdfViergeUrl())
                .imageScanneUrl(entity.getImageScanneUrl())
                .iaValidationStatus(entity.getIaValidationStatus())
                .statutIa(entity.getStatutIa())
                .statutContrat(entity.getStatutContrat())
                .raisonIa(entity.getRaisonIa())
                // Calendrier de paiement
                .dateDebut(entity.getDateDebut())
                .dateFin(entity.getDateFin())
                .prochainPaiement(entity.getProchainPaiement())
                .build();
    }
}
