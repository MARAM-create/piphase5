package com.locavia.backend.service.impl;

import com.locavia.backend.service.IEmailService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.locavia.backend.dto.TransactionResponseDTO;
import com.locavia.backend.entity.ContratLocation;
import com.locavia.backend.entity.TransactionPaiement;
import com.locavia.backend.enums.StatutContrat;
import org.hibernate.Hibernate;
import com.locavia.backend.enums.StatutPaiement;
import com.locavia.backend.mapper.TransactionPaiementMapper;
import com.locavia.backend.repository.ContratLocationRepository;
import com.locavia.backend.repository.TransactionPaiementRepository;
import com.locavia.backend.service.IFactureService;
import com.locavia.backend.service.ITransactionPaiementService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionPaiementServiceImpl implements ITransactionPaiementService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    private final TransactionPaiementRepository transactionPaiementRepository;
    private final ContratLocationRepository contratLocationRepository;
    private final TransactionPaiementMapper transactionPaiementMapper;
    private final IFactureService factureService;
    private final IEmailService emailService;

    @PostConstruct
    public void initStripe() {
        Stripe.apiKey = stripeApiKey;
        log.info("✅ Stripe API initialisée avec succès");
    }

    // ══════════════════════════════════════════════════════════
    //  1. Initier un paiement Stripe Checkout
    // ══════════════════════════════════════════════════════════

    @Override
    public java.util.Map<String, String> initierPaiement(Long contratId) {
        try {
            log.info("🚀 Initiation du paiement pour le contrat ID: {}", contratId);

            // 1. Vérifier l'existence du contrat
            ContratLocation contrat = contratLocationRepository.findById(contratId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "❌ Erreur : Le Contrat avec l'ID " + contratId + " n'existe pas en base de données."));

            // 2. Vérifier le statut du contrat
            if (contrat.getStatutContrat() != StatutContrat.EN_ATTENTE_PAIEMENT) {
                throw new IllegalStateException(
                        "⚠️ Statut invalide : Le contrat est en statut " + contrat.getStatutContrat()
                        + ". Le paiement ne peut être initié que si le statut est EN_ATTENTE_PAIEMENT.");
            }

            // 3. Validation des données financières
            if (contrat.getAnnonce() == null) {
                throw new IllegalStateException("❌ Erreur : Aucune annonce n'est associée à ce contrat.");
            }

            BigDecimal prixMensuel = contrat.getAnnonce().getPrixMensuel();
            BigDecimal montantCaution = contrat.getAnnonce().getMontantCaution();

            if (prixMensuel == null || prixMensuel.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("❌ Erreur : Le prix mensuel doit être supérieur à 0.");
            }

            if (montantCaution == null) montantCaution = BigDecimal.ZERO;
            BigDecimal montantTotal = prixMensuel.add(montantCaution);

            // 4. Conversion en centimes
            long montantCentimes = montantTotal.multiply(BigDecimal.valueOf(100)).longValue();

            // 5. Création session Stripe
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:8080/api/paiements/success?sessionId={CHECKOUT_SESSION_ID}")
                    .setCancelUrl("http://localhost:4200/tableau-de-bord/etudiant/contrats")
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("eur")
                                                    .setUnitAmount(montantCentimes)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Paiement Loyer + Caution")
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            System.out.println("=== STRIPE DEBUG ===");
            System.out.println("Stripe API Key set: " + (Stripe.apiKey != null && !Stripe.apiKey.isEmpty()));
            System.out.println("Stripe API Key prefix: " + (Stripe.apiKey != null ? Stripe.apiKey.substring(0, Math.min(12, Stripe.apiKey.length())) + "..." : "NULL"));
            System.out.println("Montant en centimes envoyé à Stripe: " + montantCentimes);
            System.out.println("====================");

            Session session = Session.create(params);
            log.info("💳 Session Stripe créée : {}", session.getId());

            // 6. Sauvegarde transaction
            TransactionPaiement transaction = TransactionPaiement.builder()
                    .contrat(contrat)
                    .client(contrat.getLocataire())
                    .montantTotal(montantTotal)
                    .stripeSessionId(session.getId())
                    .statutPaiement(StatutPaiement.INITIE)
                    .build();
            transactionPaiementRepository.save(transaction);

            // 7. RETOUR RADICAL : On renvoie juste une Map avec l'URL
            java.util.Map<String, String> response = new java.util.HashMap<>();
            response.put("checkoutUrl", session.getUrl());
            
            System.out.println("DEBUG URL GENERATED: " + session.getUrl());
            return response;

        } catch (Exception e) {
            System.err.println("❌ FATAL ERROR IN initierPaiement:");
            e.printStackTrace();
            throw new RuntimeException("Erreur critique: " + e.getMessage(), e);
        }
    }


    // ══════════════════════════════════════════════════════════
    //  2. Lire un paiement par ID
    // ══════════════════════════════════════════════════════════

    @Override
    public TransactionResponseDTO getPaiementById(Long id) {
        TransactionPaiement transaction = transactionPaiementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "TransactionPaiement introuvable avec l'id : " + id));
        return transactionPaiementMapper.toResponseDTO(transaction);
    }

    // ══════════════════════════════════════════════════════════
    //  3. Lister tous les paiements
    // ══════════════════════════════════════════════════════════

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<TransactionResponseDTO> getAllPaiements() {
        return transactionPaiementRepository.findAll()
                .stream()
                .map(transactionPaiementMapper::toResponseDTO)
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<TransactionResponseDTO> getPaiementsByContratId(Long contratId) {
        return transactionPaiementRepository.findByContratId(contratId)
                .stream()
                .map(transactionPaiementMapper::toResponseDTO)
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<TransactionResponseDTO> getPaiementsByCurrentUser() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !(auth.getPrincipal() instanceof com.locavia.backend.entity.Utilisateur)) {
            return List.of();
        }

        com.locavia.backend.entity.Utilisateur utilisateur = (com.locavia.backend.entity.Utilisateur) auth.getPrincipal();
        log.info("🔍 Récupération des paiements pour l'utilisateur id={}", utilisateur.getId());

        return transactionPaiementRepository.findByClientId(utilisateur.getId())
                .stream()
                .map(transactionPaiementMapper::toResponseDTO)
                .toList();
    }

    // ══════════════════════════════════════════════════════════
    //  4. Callback Stripe — Valider le paiement
    // ══════════════════════════════════════════════════════════

    @Override
    @org.springframework.transaction.annotation.Transactional
    public String validerPaiement(String sessionId) {
        TransactionPaiement transaction = transactionPaiementRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucune transaction trouvée pour la session Stripe : " + sessionId));

        // Mettre à jour la transaction
        transaction.setStatutPaiement(StatutPaiement.VALIDE);
        transaction.setDatePaiement(LocalDateTime.now());
        transactionPaiementRepository.save(transaction);

        // Mettre à jour le contrat → ACTIF + fixer prochainPaiement
        ContratLocation contrat = transaction.getContrat();
        if (contrat.getStatutContrat() == StatutContrat.BROUILLON || 
            contrat.getStatutContrat() == StatutContrat.EN_ATTENTE_PAIEMENT) {
            
            contrat.setStatutContrat(StatutContrat.ACTIF);
            contrat.setProchainPaiement(LocalDateTime.now().plusMonths(1));
            contratLocationRepository.save(contrat);
        }

        log.info("✅ Paiement validé pour la session {} — Contrat id={} → ACTIF, prochainPaiement={}",
                sessionId, contrat.getId(), contrat.getProchainPaiement());

        // Précharger les informations nécessaires pour le thread asynchrone afin d'éviter la LazyInitException
        String emailLocataire = contrat.getLocataire().getEmail();
        String nomLocataire = contrat.getLocataire().getPrenom() + " " + contrat.getLocataire().getNom();
        String emailBailleur = contrat.getBailleur().getEmail();
        String nomBailleur = contrat.getBailleur().getPrenom() + " " + contrat.getBailleur().getNom();
        String titreAnnonce = contrat.getAnnonce() != null ? contrat.getAnnonce().getTitre() : "votre bien loué";
        Long contratId = contrat.getId();
        Long transactionId = transaction.getId();
        java.math.BigDecimal montantTotal = transaction.getMontantTotal();

        // Lancer la génération PDF et l'envoi d'e-mails en arrière-plan pour ne pas bloquer Stripe
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                byte[] facturePdf = factureService.genererFacturePdf(transaction);

                String sujet = "Locavia — Confirmation de paiement & Facture";
                String contenuHtml = String.format("""
                        <html>
                        <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #1E3A5F;">✅ Paiement Confirmé</h2>
                                <p>Bonjour <strong>%s</strong>,</p>
                                <p>Votre paiement pour le bien "<strong>%s</strong>" a été validé avec succès.</p>
                                <table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
                                    <tr style="background-color: #F1F5F9;">
                                        <td style="padding: 10px; font-weight: bold;">Montant</td>
                                        <td style="padding: 10px;">%s EUR</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px; font-weight: bold;">Contrat N°</td>
                                        <td style="padding: 10px;">%d</td>
                                    </tr>
                                    <tr style="background-color: #F1F5F9;">
                                        <td style="padding: 10px; font-weight: bold;">Transaction N°</td>
                                        <td style="padding: 10px;">%d</td>
                                    </tr>
                                </table>
                                <p>Vous trouverez votre facture en pièce jointe.</p>
                                <p style="color: #64748B; font-size: 12px; margin-top: 30px;">
                                    Cordialement,<br>L'équipe Locavia
                                </p>
                            </div>
                        </body>
                        </html>
                        """,
                        nomLocataire, titreAnnonce,
                        montantTotal,
                        contratId,
                        transactionId
                );

                String nomFichier = "invoice_" + transactionId + ".pdf";

                // SAUVEGARDER LE FICHIER SUR LE DISQUE
                java.nio.file.Path facturePath = java.nio.file.Paths.get("uploads/factures");
                if (!java.nio.file.Files.exists(facturePath)) {
                    java.nio.file.Files.createDirectories(facturePath);
                }
                java.nio.file.Path targetPath = facturePath.resolve(nomFichier);
                java.nio.file.Files.write(targetPath, facturePdf);
                
                // Mettre à jour l'URL (dans un bloc transactionnel séparé ou via repository simple)
                transaction.setFichierRecuPdfUrl("uploads/factures/" + nomFichier);
                transactionPaiementRepository.save(transaction);

                // ENVOI AU LOCATAIRE
                emailService.envoyerEmailAvecPieceJointe(emailLocataire, sujet, contenuHtml, facturePdf, nomFichier);
                log.info("📧 Facture sauvegardée et envoyée par email au locataire {} pour la transaction id={}",
                        emailLocataire, transactionId);

                // ENVOI AU BAILLEUR
                try {
                    String sujetBailleur = "Locavia — Paiement reçu pour votre bien";
                    String contenuBailleur = String.format(
                            "Bonjour %s,\n\n"
                                    + "Bonne nouvelle ! Votre locataire %s vient de régler le loyer "
                                    + "pour le bien \"%s\".\n\n"
                                    + "Montant reçu : %s EUR\n"
                                    + "Contrat N° : %d\n"
                                    + "Le contrat est désormais ACTIF.\n\n"
                                    + "Cordialement,\n"
                                    + "L'équipe Locavia",
                            nomBailleur, nomLocataire, titreAnnonce,
                            montantTotal, contratId
                    );

                    emailService.envoyerEmailAvecPieceJointe(emailBailleur, sujetBailleur, contenuBailleur, facturePdf, nomFichier);
                    log.info("📧 Notification avec facture envoyée au bailleur {} pour la transaction id={}",
                            emailBailleur, transactionId);
                } catch (Exception ex) {
                    log.error("⚠️ Erreur lors de l'envoi de la notification au bailleur (transaction id={}).", transactionId, ex);
                }

            } catch (Exception e) {
                log.error("⚠️ Erreur lors de la génération PDF ou de l'envoi par email (transaction id={}). "
                        + "Le paiement a bien été validé.", transactionId, e);
            }
        });

        return "redirect:http://localhost:4200/contrats?payment=success";
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] genererRecuPdf(Long id) {
        TransactionPaiement transaction = transactionPaiementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction introuvable avec l'id : " + id));

        // On vérifie que c'est bien valide (sécurité métier)
        if (transaction.getStatutPaiement() != StatutPaiement.VALIDE) {
            throw new IllegalStateException("Le paiement n'est pas validé. Impossible de générer un reçu.");
        }

        // Force le chargement des associations lazy pour éviter LazyInitializationException
        Hibernate.initialize(transaction.getClient());
        Hibernate.initialize(transaction.getContrat());
        if (transaction.getContrat() != null) {
            Hibernate.initialize(transaction.getContrat().getAnnonce());
        }

        try {
            return factureService.genererFacturePdf(transaction);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération du PDF pour la transaction {}", id, e);
            throw new RuntimeException("Erreur de génération PDF : " + e.getMessage(), e);
        }
    }
}
