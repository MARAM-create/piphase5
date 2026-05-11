package com.locavia.backend.mapper;

import org.springframework.stereotype.Component;
import com.locavia.backend.dto.TransactionResponseDTO;
import com.locavia.backend.entity.TransactionPaiement;

/**
 * Mapper manuel pour TransactionPaiement → TransactionResponseDTO.
 */
@Component
public class TransactionPaiementMapper {

    /**
     * Convertit une entité en DTO de réponse.
     * Le champ checkoutUrl doit être injecté manuellement par le service
     * car il provient de la session Stripe, pas de l'entité.
     */
    public TransactionResponseDTO toResponseDTO(TransactionPaiement entity) {
        return TransactionResponseDTO.builder()
                .id(entity.getId())
                .contratId(entity.getContrat() != null ? entity.getContrat().getId() : null)
                .clientId(entity.getClient() != null ? entity.getClient().getId() : null)
                .clientFullName(entity.getClient() != null ? entity.getClient().getPrenom() + " " + entity.getClient().getNom() : null)                .annonceTitre(entity.getContrat() != null && entity.getContrat().getAnnonce() != null ? entity.getContrat().getAnnonce().getTitre() : null)
                .montantTotal(entity.getMontantTotal())
                .stripeSessionId(entity.getStripeSessionId())
                .datePaiement(entity.getDatePaiement())
                .statutPaiement(entity.getStatutPaiement())
                .fichierRecuPdfUrl(entity.getFichierRecuPdfUrl())
                .build();
    }
}
