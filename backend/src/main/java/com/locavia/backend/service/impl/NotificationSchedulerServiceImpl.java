package com.locavia.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.locavia.backend.entity.ContratLocation;
import com.locavia.backend.repository.ContratLocationRepository;
import com.locavia.backend.service.IEmailService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Service planifié pour l'envoi de rappels de paiement.
 * S'exécute tous les jours à 8h00 et envoie un rappel
 * aux locataires dont le prochain paiement est dans 2 jours.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationSchedulerServiceImpl {

    private final ContratLocationRepository contratLocationRepository;
    private final IEmailService emailService;

    // ══════════════════════════════════════════════════════════
    //  Rappel quotidien — tous les jours à 8h00
    // ══════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 8 * * *")
    public void envoyerRappelsPaiement() {
        log.info("⏰ Lancement du job de rappels de paiement...");

        // Chercher les contrats dont le prochain paiement est dans exactement 2 jours
        LocalDate dateRappel = LocalDate.now().plusDays(2);
        LocalDateTime debutJournee = dateRappel.atStartOfDay();
        LocalDateTime finJournee = dateRappel.atTime(LocalTime.MAX);

        List<ContratLocation> contrats = contratLocationRepository
                .findByProchainPaiementBetween(debutJournee, finJournee);

        if (contrats.isEmpty()) {
            log.info("📭 Aucun rappel à envoyer pour le {}", dateRappel);
            return;
        }

        log.info("📬 {} rappel(s) de paiement à envoyer pour le {}", contrats.size(), dateRappel);

        for (ContratLocation contrat : contrats) {
            try {
                String emailLocataire = contrat.getLocataire().getEmail();
                String nomLocataire = contrat.getLocataire().getPrenom() + " " + contrat.getLocataire().getNom();                String titreAnnonce = contrat.getAnnonce() != null
                        ? contrat.getAnnonce().getTitre() : "votre bien loué";
                String montant = contrat.getAnnonce() != null
                        ? contrat.getAnnonce().getPrixMensuel() + " EUR" : "N/A";

                String sujet = "Rappel Locavia : Paiement de loyer dans 48h";
                String contenu = String.format(
                        "Bonjour %s,\n\n"
                                + "Rappel : Votre loyer pour l'appartement \"%s\" est dû dans 48h.\n\n"
                                + "Montant : %s\n"
                                + "Date d'échéance : %s\n\n"
                                + "Veuillez vous assurer que le paiement sera effectué à temps "
                                + "pour éviter tout désagrément.\n\n"
                                + "Cordialement,\n"
                                + "L'équipe Locavia",
                        nomLocataire, titreAnnonce, montant,
                        dateRappel.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                );

                emailService.envoyerEmail(emailLocataire, sujet, contenu);
                log.info("✅ Rappel envoyé à {} pour le contrat id={}", emailLocataire, contrat.getId());

            } catch (Exception e) {
                log.error("❌ Erreur lors de l'envoi du rappel pour le contrat id={}", contrat.getId(), e);
                // On continue avec les autres contrats
            }
        }

        log.info("⏰ Job de rappels terminé.");
    }
}
