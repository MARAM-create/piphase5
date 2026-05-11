package com.locavia.backend.service;

import com.locavia.backend.entity.DemandeLocation;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService implements IEmailService {

    private final JavaMailSender mailSender;
    private final PdfService pdfService;

    // --- Implémentation de l'interface IEmailService ---

    @Override
    public void envoyerEmail(String destinataire, String sujet, String contenu) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(contenu, true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur envoi email simple : " + e.getMessage());
        }
    }

    @Override
    public void envoyerEmailAvecPieceJointe(String destinataire, String sujet, String contenu,
                                            byte[] pdfBytes, String nomFichierPdf) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(contenu, true);
            helper.addAttachment(nomFichierPdf, new ByteArrayResource(pdfBytes));

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur envoi email avec pièce jointe : " + e.getMessage());
        }
    }

    // --- Ta méthode spécifique pour les demandes de location ---

    public void envoyerDemandeAuProprietaire(DemandeLocation demande) {
        try {
            // Sécurité : On vérifie que l'annonce et le propriétaire existent
            if (demande.getAnnonce() == null || demande.getAnnonce().getProprietaire() == null) {
                System.err.println("Erreur : Impossible d'identifier le propriétaire.");
                return;
            }

            byte[] pdf = pdfService.genererPdfDemande(demande);

            // On récupère l'email du propriétaire de l'annonce
            String emailProprietaire = demande.getAnnonce().getProprietaire().getEmail();
            String sujet = "Nouvelle demande de location — " + demande.getAnnonce().getTitre();
            String corps = construireCorpsEmail(demande);

            // Utilisation de la méthode de l'interface pour l'envoi effectif
            envoyerEmailAvecPieceJointe(
                    emailProprietaire,
                    sujet,
                    corps,
                    pdf,
                    "demande_location_" + demande.getIdDemande() + ".pdf"
            );

        } catch (Exception e) {
            System.err.println("Erreur globale envoyerDemandeAuProprietaire : " + e.getMessage());
        }
    }

    private String construireCorpsEmail(DemandeLocation demande) {
        String prenom = (demande.getEtudiant() != null) ? demande.getEtudiant().getPrenom() : "—";
        String nom = (demande.getEtudiant() != null) ? demande.getEtudiant().getNom() : "—";
        String email = (demande.getEtudiant() != null) ? demande.getEtudiant().getEmail() : "—";
        String titre = (demande.getAnnonce() != null) ? demande.getAnnonce().getTitre() : "—";

        return """
            <html>
            <body style="font-family: sans-serif; background: #FAF7F4; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white;
                          border-radius: 14px; overflow: hidden;
                          border: 0.5px solid #E8DDD2; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

                <div style="background: #5C4A3A; padding: 24px 28px;">
                  <h1 style="color: white; margin: 0; font-size: 22px;
                              font-weight: 500; letter-spacing: 1px;">
                    Locavia<span style="color: #C9A96E;">.</span>
                  </h1>
                  <p style="color: #D4C4B0; margin: 6px 0 0;
                             font-size: 13px;">
                    Nouvelle demande de location reçue
                  </p>
                </div>

                <div style="padding: 28px;">
                  <p style="color: #5C4A3A; font-size: 15px; margin: 0 0 16px;">
                    Bonjour,
                  </p>
                  <p style="color: #5C4A3A; font-size: 14px;
                             line-height: 1.6; margin: 0 0 20px;">
                    Vous avez reçu une nouvelle demande de location pour votre
                    annonce <strong>%s</strong>.
                  </p>

                  <div style="background: #FAF7F4; border-radius: 10px;
                               padding: 16px; margin-bottom: 20px;">
                    <p style="font-size: 11px; color: #B8A090;
                               text-transform: uppercase; letter-spacing: 0.8px;
                               margin: 0 0 12px; font-weight: 500;">
                      Informations du candidat
                    </p>
                    <table style="width: 100%%; font-size: 13px;">
                      <tr>
                        <td style="color: #9C7E6A; padding: 4px 0;">Nom complet</td>
                        <td style="color: #5C4A3A; font-weight: 500;
                                   text-align: right;">%s %s</td>
                      </tr>
                      <tr>
                        <td style="color: #9C7E6A; padding: 4px 0;">Email</td>
                        <td style="color: #5C4A3A; font-weight: 500;
                                   text-align: right;">%s</td>
                      </tr>
                      <tr>
                        <td style="color: #9C7E6A; padding: 4px 0;">Personnes</td>
                        <td style="color: #5C4A3A; font-weight: 500;
                                   text-align: right;">%s personne(s)</td>
                      </tr>
                      <tr>
                        <td style="color: #9C7E6A; padding: 4px 0;">Date d'entrée</td>
                        <td style="color: #5C4A3A; font-weight: 500;
                                   text-align: right;">%s</td>
                      </tr>
                      <tr>
                        <td style="color: #9C7E6A; padding: 4px 0;">Durée</td>
                        <td style="color: #5C4A3A; font-weight: 500;
                                   text-align: right;">%s</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background: #F7F0E3; border-radius: 10px;
                               padding: 16px; margin-bottom: 24px;">
                    <p style="font-size: 11px; color: #B8A090;
                               text-transform: uppercase; letter-spacing: 0.8px;
                               margin: 0 0 8px; font-weight: 500;">
                      Message du candidat
                    </p>
                    <p style="font-size: 13px; color: #5C4A3A;
                               line-height: 1.6; margin: 0;">
                      %s
                    </p>
                  </div>

                  <p style="color: #9C7E6A; font-size: 13px;
                             line-height: 1.6; margin: 0 0 8px;">
                    Le dossier complet de la demande est joint en pièce jointe
                    au format PDF.
                  </p>
                  <p style="color: #9C7E6A; font-size: 13px;
                             line-height: 1.6; margin: 0;">
                    Connectez-vous à Locavia pour accepter ou refuser
                    cette demande.
                  </p>
                </div>

                <div style="background: #FAF7F4; padding: 16px 28px;
                             border-top: 0.5px solid #E8DDD2;">
                  <p style="font-size: 11px; color: #B8A090;
                             margin: 0; text-align: center;">
                    Locavia — Plateforme de location étudiante — locavia.tn
                  </p>
                </div>

              </div>
            </body>
            </html>
            """.formatted(
                titre, prenom, nom, email,
                demande.getNombrePersonnes() != null ? demande.getNombrePersonnes() : "—",
                demande.getDateEntree() != null ? demande.getDateEntree().toString() : "—",
                demande.getDureeLocation() != null ? demande.getDureeLocation() : "—",
                demande.getMessageCandidat() != null ? demande.getMessageCandidat() : "—"
        );
    }
}