package com.locavia.backend.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.locavia.backend.entity.ContratLocation;
import com.locavia.backend.enums.IAValidationStatus;
import com.locavia.backend.enums.StatutContrat;
import com.locavia.backend.exception.ContractComplianceException;
import com.locavia.backend.repository.ContratLocationRepository;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Service de paiement Stripe pour les contrats de location.
 *
 * <h2>Pré-condition obligatoire</h2>
 * <p>Avant de créer une session Stripe, le contrat <b>doit</b> avoir été validé
 * par le service IA ({@link IAVerificationService}).
 * Si le contrat n'est pas en statut {@code ACTIF}/{@code EN_ATTENTE_PAIEMENT}
 * ou si sa validation IA est {@code PENDING}/{@code REJECTED},
 * une {@link ContractComplianceException} est levée et le paiement est bloqué (HTTP 400).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StripePaymentService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    private final ContratLocationRepository contratLocationRepository;

    @PostConstruct
    public void initStripe() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Crée une session de paiement Stripe pour un contrat donné.
     *
     * <p><b>Pré-condition IA obligatoire :</b>
     * Le contrat doit avoir {@code iaValidationStatus = VALIDATED}.
     * Si ce n'est pas le cas, le paiement est bloqué et une
     * {@link ContractComplianceException} est levée avec la liste des problèmes.
     *
     * @param contratId identifiant du contrat
     * @return map contenant l'URL de paiement Stripe ({@code paymentUrl})
     * @throws ContractComplianceException  si la vérification IA n'est pas validée
     * @throws RuntimeException             en cas d'erreur Stripe
     */
    public Map<String, String> createCheckoutSession(Long contratId) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new RuntimeException(
                        "Contrat introuvable avec l'id : " + contratId));

        // ── VÉRIFICATION IA OBLIGATOIRE ──────────────────────────────────────
        assertContractIsIaValidated(contrat);

        // ── Création de la session Stripe ─────────────────────────────────────
        log.info("💳 Création session Stripe pour le contrat id={} (IA validée ✅)", contratId);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCurrency("eur")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("eur")
                                                .setUnitAmount(50000L) // 500.00 EUR
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Paiement Contrat Locavia #" + contratId)
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .setSuccessUrl("http://localhost:4200/contrats?payment=success&contratId=" + contratId)
                .setCancelUrl("http://localhost:4200/contrats?payment=cancel&contratId=" + contratId)
                .build();

        try {
            Session session = Session.create(params);
            log.info("✅ Session Stripe créée pour le contrat id={} : {}", contratId, session.getId());
            return Collections.singletonMap("paymentUrl", session.getUrl());
        } catch (StripeException e) {
            log.error("❌ Échec Stripe pour le contrat id={} : {}", contratId, e.getMessage());
            throw new RuntimeException("Échec de la création de session Stripe : " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Vérification du pré-requis IA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Vérifie que le contrat a bien été validé par l'IA avant autorisation du paiement.
     *
     * <p>Conditions bloquantes :
     * <ul>
     *   <li>{@code iaValidationStatus == PENDING} → l'analyse n'a pas encore été lancée</li>
     *   <li>{@code iaValidationStatus == REJECTED} → le contrat a été rejeté (signatures manquantes)</li>
     *   <li>{@code statutContrat} ni {@code EN_ATTENTE_PAIEMENT} ni {@code ACTIF} → cycle de vie incorrect</li>
     * </ul>
     *
     * @throws ContractComplianceException avec la liste des problèmes détectés
     */
    private void assertContractIsIaValidated(ContratLocation contrat) {
        List<String> blockers = new java.util.ArrayList<>();

        IAValidationStatus iaStatus = contrat.getIaValidationStatus();

        if (iaStatus == IAValidationStatus.PENDING) {
            blockers.add("Le contrat n'a pas encore été soumis à la vérification IA. "
                    + "Uploadez le document scanné pour déclencher l'analyse.");
        } else if (iaStatus == IAValidationStatus.REJECTED) {
            blockers.add("Le contrat a été REJETÉ par l'IA (signatures ou tampon manquants).");
            // Inclure la raison enregistrée si disponible
            if (contrat.getRaisonIa() != null && !contrat.getRaisonIa().isBlank()) {
                blockers.add("Détail : " + contrat.getRaisonIa());
            }
        }

        StatutContrat statut = contrat.getStatutContrat();
        boolean paymentAllowed = statut == StatutContrat.EN_ATTENTE_PAIEMENT
                || statut == StatutContrat.ACTIF;

        if (!paymentAllowed) {
            blockers.add("Le statut du contrat est '" + statut
                    + "'. Le paiement n'est autorisé qu'en statut EN_ATTENTE_PAIEMENT ou ACTIF.");
        }

        if (!blockers.isEmpty()) {
            log.warn("⛔ Paiement bloqué pour le contrat id={} : {}", contrat.getId(), blockers);
            throw new ContractComplianceException(blockers, 0.0);
        }
    }
}
