package com.locavia.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.locavia.backend.enums.StatutPaiement;
import com.locavia.backend.enums.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité principale — Transaction de paiement (Stripe).
 * Chaque paiement est lié à un contrat et à un client (le locataire).
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionPaiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Relations ────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrat_id", nullable = false)
    private ContratLocation contrat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Utilisateur client;

    // ── Champs métier ────────────────────────────────────────

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montantTotal;

    private String stripeSessionId;

    private LocalDateTime datePaiement;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPaiement statutPaiement;

    private String fichierRecuPdfUrl;
}
