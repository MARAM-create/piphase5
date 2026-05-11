package com.locavia.backend.service.AvisReclamation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service("avisEmailService")
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@locavia.com}")
    private String fromEmail;

    @Async
    public void sendReclamationConfirmation(String to, Long reclamationId, String titre, String priority) {
        if (to == null || to.isBlank()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("✅ Réclamation #" + reclamationId + " reçue – Locavia");
            message.setText(
                "Bonjour,\n\n" +
                "Votre réclamation a bien été enregistrée sur la plateforme Locavia.\n\n" +
                "📋 Détails :\n" +
                "   - Référence  : #" + reclamationId + "\n" +
                "   - Sujet      : " + titre + "\n" +
                "   - Priorité   : " + priority + "\n" +
                "   - Statut     : EN ATTENTE DE TRAITEMENT\n\n" +
                "Notre équipe a bien pris en compte votre demande et vous informera dès que " +
                "son statut sera mis à jour.\n\n" +
                "Merci pour votre confiance,\n" +
                "L'équipe Locavia 🏠\n" +
                "--\n" +
                "Cet email est envoyé automatiquement, merci de ne pas y répondre."
            );
            mailSender.send(message);
            log.info("Confirmation email sent to {} for reclamation #{}", to, reclamationId);
        } catch (Exception e) {
            log.error("Failed to send confirmation email for reclamation #{}: {}", reclamationId, e.getMessage());
        }
    }

    @Async
    public void sendReclamationResolved(String to, Long reclamationId, String titre) {
        if (to == null || to.isBlank()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🎉 Réclamation #" + reclamationId + " résolue – Locavia");
            message.setText(
                "Bonjour,\n\n" +
                "Nous avons le plaisir de vous informer que votre réclamation a été résolue.\n\n" +
                "📋 Détails :\n" +
                "   - Référence : #" + reclamationId + "\n" +
                "   - Sujet     : " + titre + "\n" +
                "   - Statut    : ✅ RÉSOLU\n\n" +
                "Nous espérons que cette résolution vous donne entière satisfaction. " +
                "N'hésitez pas à nous contacter si vous avez d'autres questions.\n\n" +
                "Merci de votre confiance,\n" +
                "L'équipe Locavia 🏠\n" +
                "--\n" +
                "Cet email est envoyé automatiquement, merci de ne pas y répondre."
            );
            mailSender.send(message);
            log.info("Resolution email sent to {} for reclamation #{}", to, reclamationId);
        } catch (Exception e) {
            log.error("Failed to send resolution email for reclamation #{}: {}", reclamationId, e.getMessage());
        }
    }
}

