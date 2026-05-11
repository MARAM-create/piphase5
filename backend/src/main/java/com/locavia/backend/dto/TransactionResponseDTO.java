package com.locavia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.locavia.backend.enums.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour une transaction de paiement.
 * Inclut l'URL Stripe Checkout pour rediriger le client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponseDTO {

    private Long id;
    private Long contratId;
    private Long clientId;
    private String clientFullName;
    private String annonceTitre;
    private BigDecimal montantTotal;
    private String stripeSessionId;
    private LocalDateTime datePaiement;
    private StatutPaiement statutPaiement;
    private String checkoutUrl;
    private String fichierRecuPdfUrl;
}

