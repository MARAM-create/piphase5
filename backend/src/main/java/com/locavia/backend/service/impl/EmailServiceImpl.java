package com.locavia.backend.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.locavia.backend.service.IEmailService;

/**
 * Implémentation du service d'envoi d'emails.
 * Utilise JavaMailSender (Spring Boot Mail) pour envoyer
 * des emails simples et des emails avec pièces jointes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    // ══════════════════════════════════════════════════════════
    //  Email simple (texte)
    // ══════════════════════════════════════════════════════════

    @Override
    public void envoyerEmail(String destinataire, String sujet, String contenu) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(destinataire);
            message.setSubject(sujet);
            message.setText(contenu);

            mailSender.send(message);
            log.info("📧 Email envoyé à {} — Sujet: {}", destinataire, sujet);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email à {} — Sujet: {}", destinataire, sujet, e);
            throw new RuntimeException("Impossible d'envoyer l'email à " + destinataire, e);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Email avec pièce jointe PDF
    // ══════════════════════════════════════════════════════════

    @Override
    public void envoyerEmailAvecPieceJointe(String destinataire, String sujet, String contenu,
                                             byte[] pdfBytes, String nomFichierPdf) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(contenu, true); // true = HTML

            // Attacher le PDF
            ByteArrayResource pdfResource = new ByteArrayResource(pdfBytes);
            helper.addAttachment(nomFichierPdf, pdfResource, "application/pdf");

            mailSender.send(mimeMessage);
            log.info("📧 Email avec facture PDF envoyé à {} — Sujet: {}, Fichier: {}",
                    destinataire, sujet, nomFichierPdf);
        } catch (MessagingException e) {
            log.error("❌ Erreur lors de l'envoi de l'email avec pièce jointe à {} — Sujet: {}",
                    destinataire, sujet, e);
            throw new RuntimeException("Impossible d'envoyer l'email avec pièce jointe à " + destinataire, e);
        }
    }
}
