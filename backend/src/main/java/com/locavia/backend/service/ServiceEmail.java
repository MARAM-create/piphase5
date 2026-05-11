package com.locavia.backend.service;

import com.locavia.backend.entity.Utilisateur;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServiceEmail {

    private final JavaMailSender mailSender;

    @Value("${application.url-frontend}")
    private String urlFrontend;

    @Value("${spring.mail.username}")
    private String emailAdmin;

    // ── Email vérification ───────────────────────────────
    @Async
    public void envoyerEmailVerification(Utilisateur utilisateur) {
        String lien = urlFrontend + "/verifier-email?token="
                + utilisateur.getTokenVerificationEmail();
        envoyer(
                utilisateur.getEmail(),
                "Locavia — Vérification de votre email",
                construireEmail(
                        "Vérifiez votre adresse email",
                        utilisateur.getPrenom(),
                        "Cliquez sur le bouton ci-dessous pour vérifier votre email. Ce lien est valable 24 heures.",
                        lien, "Vérifier mon email", "#22c55e"
                )
        );
    }

    // ── OTP par email (si pas de téléphone) ─────────────
    @Async
    public void envoyerOtpEmail(Utilisateur utilisateur, String otp) {
        String html = """
            <!DOCTYPE html><html lang="fr"><body
              style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:40px 20px">
                  <table width="600" cellpadding="0" cellspacing="0"
                    style="background:white;border-radius:16px;overflow:hidden">
                    <tr>
                      <td style="background:#22c55e;padding:32px;text-align:center">
                        <h1 style="color:white;margin:0">🏠 Locavia</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 32px;text-align:center">
                        <h2 style="color:#111827">Code de vérification</h2>
                        <p style="color:#374151">Bonjour <strong>%s</strong>,</p>
                        <p style="color:#4b5563">Votre code OTP pour activer votre compte :</p>
                        <div style="background:#f0fdf4;border:2px solid #22c55e;
                                    border-radius:12px;padding:24px;margin:24px 0;
                                    letter-spacing:8px;font-size:36px;font-weight:900;
                                    color:#16a34a">
                          %s
                        </div>
                        <p style="color:#9ca3af;font-size:13px">
                          Ce code expire dans <strong>10 minutes</strong>.<br>
                          Ne le partagez jamais.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f9fafb;padding:20px;text-align:center">
                        <p style="color:#9ca3af;font-size:12px;margin:0">
                          © 2024 Locavia
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(utilisateur.getPrenom(), otp);

        envoyer(utilisateur.getEmail(), "Locavia — Code de vérification", html);
    }

    // ── Notification admin — nouvel utilisateur ──────────
    @Async
    public void notifierAdminNouvelInscrit(Utilisateur utilisateur) {
        String html = """
            <!DOCTYPE html><html lang="fr"><body
              style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:40px 20px">
                  <table width="600" cellpadding="0" cellspacing="0"
                    style="background:white;border-radius:16px;overflow:hidden">
                    <tr>
                      <td style="background:#1e40af;padding:32px;text-align:center">
                        <h1 style="color:white;margin:0">🏠 Locavia — Admin</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 32px">
                        <h2 style="color:#111827;margin-top:0">
                          🔔 Nouvel utilisateur à approuver
                        </h2>
                        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0">
                          <p style="margin:8px 0;color:#374151">
                            <strong>Nom :</strong> %s %s
                          </p>
                          <p style="margin:8px 0;color:#374151">
                            <strong>Email :</strong> %s
                          </p>
                          <p style="margin:8px 0;color:#374151">
                            <strong>Rôle :</strong> %s
                          </p>
                          <p style="margin:8px 0;color:#374151">
                            <strong>Téléphone :</strong> %s
                          </p>
                        </div>
                        <div style="text-align:center;margin:24px 0">
                          <a href="%s/tableau-de-bord/admin"
                            style="background:#1e40af;color:white;padding:14px 32px;
                                   border-radius:8px;text-decoration:none;font-weight:bold">
                            Aller au tableau de bord
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f9fafb;padding:20px;text-align:center">
                        <p style="color:#9ca3af;font-size:12px;margin:0">
                          © 2024 Locavia
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(
                utilisateur.getPrenom(),
                utilisateur.getNom(),
                utilisateur.getEmail(),
                utilisateur.getRole().name(),
                utilisateur.getTelephone() != null ? utilisateur.getTelephone() : "Non renseigné",
                urlFrontend
        );

        envoyer(emailAdmin, "🔔 Locavia — Nouveau compte à approuver", html);
    }

    // ── Alerte nouveau device ────────────────────────────
    @Async
    public void envoyerAlerteNouveauDevice(
            Utilisateur utilisateur, String ip, String device) {
        String html = """
            <!DOCTYPE html><html lang="fr"><body
              style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:40px 20px">
                  <table width="600" cellpadding="0" cellspacing="0"
                    style="background:white;border-radius:16px;overflow:hidden">
                    <tr>
                      <td style="background:#dc2626;padding:32px;text-align:center">
                        <h1 style="color:white;margin:0">🚨 Locavia — Sécurité</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 32px">
                        <h2 style="color:#111827;margin-top:0">
                          Connexion depuis un nouvel appareil
                        </h2>
                        <p style="color:#374151">
                          Bonjour <strong>%s</strong>,
                        </p>
                        <p style="color:#4b5563">
                          Une connexion à votre compte a été détectée depuis
                          un appareil ou une adresse IP inconnu(e).
                        </p>
                        <div style="background:#fef2f2;border:2px solid #dc2626;
                                    border-radius:12px;padding:20px;margin:16px 0">
                          <p style="margin:8px 0;color:#374151">
                            🌐 <strong>Adresse IP :</strong> %s
                          </p>
                          <p style="margin:8px 0;color:#374151">
                            💻 <strong>Appareil :</strong> %s
                          </p>
                        </div>
                        <p style="color:#4b5563">
                          Si c'était vous, ignorez cet email.<br>
                          Sinon, changez votre mot de passe immédiatement.
                        </p>
                        <div style="text-align:center;margin:24px 0">
                          <a href="%s/oublier-mdp"
                            style="background:#dc2626;color:white;padding:14px 32px;
                                   border-radius:8px;text-decoration:none;font-weight:bold">
                            Changer mon mot de passe
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f9fafb;padding:20px;text-align:center">
                        <p style="color:#9ca3af;font-size:12px;margin:0">
                          © 2024 Locavia
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(
                utilisateur.getPrenom(), ip, device, urlFrontend
        );

        envoyer(
                utilisateur.getEmail(),
                "🚨 Locavia — Connexion depuis un nouvel appareil",
                html
        );
    }

    // ── Reset MDP ────────────────────────────────────────
    @Async
    public void envoyerEmailReinitMdp(Utilisateur utilisateur) {
        String lien = urlFrontend + "/reinitialiser-mdp?token="
                + utilisateur.getTokenReinitMdp();
        envoyer(
                utilisateur.getEmail(),
                "Locavia — Réinitialisation du mot de passe",
                construireEmail(
                        "Réinitialisez votre mot de passe",
                        utilisateur.getPrenom(),
                        "Vous avez demandé la réinitialisation de votre mot de passe. Ce lien expire dans 1 heure.",
                        lien, "Réinitialiser mon mot de passe", "#f59e0b"
                )
        );
    }

    // ── Approbation ──────────────────────────────────────
    @Async
    public void envoyerEmailApprobation(Utilisateur utilisateur) {
        envoyer(
                utilisateur.getEmail(),
                "Locavia — Compte approuvé !",
                construireEmail(
                        "Votre compte est approuvé 🎉",
                        utilisateur.getPrenom(),
                        "Félicitations ! Votre compte a été validé. Vous pouvez maintenant vous connecter.",
                        urlFrontend + "/connexion",
                        "Se connecter", "#22c55e"
                )
        );
    }

    // ── Rejet ────────────────────────────────────────────
    @Async
    public void envoyerEmailRejet(Utilisateur utilisateur) {
        envoyer(
                utilisateur.getEmail(),
                "Locavia — Mise à jour de votre inscription",
                construireEmail(
                        "Mise à jour de votre inscription",
                        utilisateur.getPrenom(),
                        "Après examen, nous ne pouvons pas valider votre inscription. Contactez notre support.",
                        "mailto:support@locavia.com",
                        "Contacter le support", "#ef4444"
                )
        );
    }

    // ── Helpers ──────────────────────────────────────────
    private String construireEmail(String titre, String prenom, String message,
                                   String lien, String texteBouton, String couleur) {
        return """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden;
                       box-shadow:0 4px 6px rgba(0,0,0,.07)">
                <tr>
                  <td style="background:%s;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0;font-size:22px">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0;font-size:20px">%s</h2>
                    <p style="color:#374151">Bonjour <strong>%s</strong>,</p>
                    <p style="color:#4b5563;line-height:1.7">%s</p>
                    <div style="text-align:center;margin:32px 0">
                      <a href="%s"
                        style="background:%s;color:white;padding:14px 32px;
                               border-radius:8px;text-decoration:none;
                               font-weight:bold;font-size:15px;display:inline-block">
                        %s
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px 32px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">
                      © 2024 Locavia · Tous droits réservés
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(couleur, titre, prenom, message, lien, couleur, texteBouton);
    }

    private void envoyer(String destinataire, String sujet, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setFrom("noreply@locavia.com");
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException(
                    "Échec de l'envoi de l'email vers " + destinataire, e);
        }
    }

    // ── Email demande de service au prestataire ──────────
    @Async
    public void envoyerEmailDemande(
            Utilisateur prestataire,
            Utilisateur demandeur,
            com.locavia.backend.entity.DemandeService demande) {

        String urlDetail = urlFrontend + "/services/demandes/" + demande.getId();

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#f47c20;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia — Nouvelle demande</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">
                      📋 Vous avez reçu une demande de service
                    </h2>
                    <p style="color:#374151">
                      Bonjour <strong>%s</strong>,
                    </p>
                    <div style="background:#fff7ed;border:2px solid #f47c20;
                                border-radius:12px;padding:20px;margin:16px 0">
                      <p style="margin:8px 0;color:#374151">
                        👤 <strong>Demandeur :</strong> %s %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📧 <strong>Email :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📞 <strong>Téléphone :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📅 <strong>Date souhaitée :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        🕐 <strong>Heure :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📍 <strong>Ville :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        🔧 <strong>Problème :</strong> %s
                      </p>
                    </div>
                    <div style="text-align:center;margin:24px 0">
                      <a href="%s"
                        style="background:#f47c20;color:white;padding:14px 32px;
                               border-radius:8px;text-decoration:none;font-weight:bold">
                        Voir et répondre à la demande
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">© 2024 Locavia</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                prestataire.getPrenom(),
                demandeur.getPrenom(), demandeur.getNom(),
                demandeur.getEmail(),
                demandeur.getTelephone() != null ? demandeur.getTelephone() : "Non renseigné",
                demande.getDateService().toString(),
                demande.getHeureService().toString(),
                demande.getVille() != null ? demande.getVille() : "Non renseignée",
                demande.getProbleme() != null ? demande.getProbleme() : "Non renseigné",
                urlDetail
        );

        envoyer(prestataire.getEmail(), "📋 Locavia — Nouvelle demande de service", html);
    }

    @Async
    public void envoyerEmailConfirmationTransport(
            Utilisateur acheteur,
            Utilisateur prestataire,
            String titreMeuble) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#22c55e;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">✅ Transport confirmé !</h2>
                    <p style="color:#374151">Bonjour <strong>%s</strong>,</p>
                    <p style="color:#4b5563">
                      Votre demande de transport pour le meuble
                      <strong>"%s"</strong> a été
                      <strong style="color:#22c55e">confirmée</strong>
                      par <strong>%s %s</strong>.
                    </p>
                    <p style="color:#4b5563">
                      📞 Contact prestataire : %s
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">© 2024 Locavia</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                acheteur.getPrenom(),
                titreMeuble,
                prestataire.getPrenom(),
                prestataire.getNom(),
                prestataire.getTelephone() != null ? prestataire.getTelephone() : prestataire.getEmail()
        );

        envoyer(acheteur.getEmail(), "✅ Locavia — Transport confirmé", html);
    }

    // ── Email refus transport meuble ─────────────────────
    @Async
    public void envoyerEmailRefusTransport(
            Utilisateur acheteur,
            Utilisateur prestataire,
            String titreMeuble) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#ef4444;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">❌ Transport refusé</h2>
                    <p style="color:#374151">Bonjour <strong>%s</strong>,</p>
                    <p style="color:#4b5563">
                      Votre demande de transport pour le meuble
                      <strong>"%s"</strong> a été
                      <strong style="color:#ef4444">refusée</strong>
                      par <strong>%s %s</strong>.
                    </p>
                    <p style="color:#4b5563">
                      Votre meuble reste marqué comme vendu.
                      Vous pouvez contacter un autre prestataire.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">© 2024 Locavia</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                acheteur.getPrenom(),
                titreMeuble,
                prestataire.getPrenom(),
                prestataire.getNom()
        );

        envoyer(acheteur.getEmail(), "❌ Locavia — Transport refusé", html);
    }

    // ── Mail vendeur : meuble vendu ──────────────────────
    @Async
    public void envoyerEmailMeubleVendu(
            Utilisateur vendeur,
            Utilisateur acheteur,
            String titreMeuble,
            Double prix) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#4f46e5;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">
                      🎉 Votre meuble a été vendu !
                    </h2>
                    <p style="color:#374151">
                      Bonjour <strong>%s</strong>,
                    </p>
                    <p style="color:#4b5563">
                      Votre meuble <strong>"%s"</strong> a été acheté avec succès.
                    </p>
                    <div style="background:#eef2ff;border-radius:12px;
                                padding:20px;margin:16px 0">
                      <p style="margin:8px 0;color:#374151">
                        👤 <strong>Acheteur :</strong> %s %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📧 <strong>Email :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📞 <strong>Téléphone :</strong> %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        💰 <strong>Prix de vente :</strong> %.2f DT
                      </p>
                    </div>
                    <p style="color:#4b5563">
                      Nous vous souhaitons une bonne continuation sur Locavia !
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">
                      © 2024 Locavia
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                vendeur.getPrenom(),
                titreMeuble,
                acheteur.getPrenom(),
                acheteur.getNom(),
                acheteur.getEmail(),
                acheteur.getTelephone() != null ? acheteur.getTelephone() : "Non renseigné",
                prix
        );

        envoyer(vendeur.getEmail(),
                "🎉 Locavia — Votre meuble \"" + titreMeuble + "\" a été vendu", html);
    }

    // ── Mail acheteur : reçu sans transporteur ───────────
    @Async
    public void envoyerRecuAchatSansTransport(
            Utilisateur acheteur,
            String titreMeuble,
            byte[] pdfBytes) {

        String html = construireEmail(
                "Votre reçu d'achat",
                acheteur.getPrenom(),
                "Votre achat du meuble <strong>\"" + titreMeuble
                        + "\"</strong> est confirmé. "
                        + "Vous trouverez ci-joint votre reçu officiel.",
                urlFrontend + "/meubles",
                "Voir les meubles", "#4f46e5"
        );

        envoyerAvecPdf(acheteur.getEmail(),
                "✅ Locavia — Reçu d'achat : " + titreMeuble,
                html, pdfBytes, "recu-achat-locavia.pdf");
    }

    // ── Mail acheteur : reçu avec transporteur confirmé ──
    @Async
    public void envoyerRecuAchatAvecTransport(
            Utilisateur acheteur,
            String titreMeuble,
            Utilisateur transporteur,
            byte[] pdfBytes) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#22c55e;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">
                      ✅ Achat et transport confirmés !
                    </h2>
                    <p style="color:#374151">
                      Bonjour <strong>%s</strong>,
                    </p>
                    <p style="color:#4b5563">
                      Votre achat du meuble <strong>"%s"</strong>
                      est confirmé et votre transporteur a accepté la demande.
                    </p>
                    <div style="background:#f0fdf4;border:2px solid #22c55e;
                                border-radius:12px;padding:20px;margin:16px 0">
                      <p style="margin:4px 0;color:#374151;font-weight:bold">
                        🚚 Votre transporteur :
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        👤 %s %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📞 %s
                      </p>
                      <p style="margin:8px 0;color:#374151">
                        📧 %s
                      </p>
                    </div>
                    <p style="color:#4b5563">
                      Votre reçu officiel est joint à cet email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">
                      © 2024 Locavia
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                acheteur.getPrenom(),
                titreMeuble,
                transporteur.getPrenom(), transporteur.getNom(),
                transporteur.getTelephone() != null
                        ? transporteur.getTelephone() : "Non renseigné",
                transporteur.getEmail()
        );

        envoyerAvecPdf(acheteur.getEmail(),
                "✅ Locavia — Achat confirmé : " + titreMeuble,
                html, pdfBytes, "recu-achat-locavia.pdf");
    }

    // ── Helper envoi avec PDF ────────────────────────────
    private void envoyerAvecPdf(String destinataire, String sujet,
                                String html, byte[] pdfBytes,
                                String nomFichier) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setFrom("noreply@locavia.com");
            helper.setText(html, true);

            // Attacher le PDF
            helper.addAttachment(nomFichier,
                    new org.springframework.core.io.ByteArrayResource(pdfBytes),
                    "application/pdf");

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Échec de l'envoi email avec PDF vers " + destinataire, e);
        }
    }

    // ── Mail changement avis : accepté → refusé ──────────
    @Async
    public void envoyerEmailChangementAvisRefus(
            Utilisateur demandeur,
            Utilisateur prestataire,
            com.locavia.backend.entity.DemandeService demande) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#ef4444;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">
                      📋 Mise à jour de votre demande de service
                    </h2>
                    <p style="color:#374151">
                      Bonjour <strong>%s</strong>,
                    </p>
                    <p style="color:#4b5563">
                      Nous vous informons que <strong>%s %s</strong>,
                      prestataire spécialisé en <em>%s</em>,
                      a reconsidéré sa décision concernant votre demande
                      du <strong>%s à %s</strong>.
                    </p>
                    <div style="background:#fef2f2;border-left:4px solid #ef4444;
                                border-radius:8px;padding:16px;margin:16px 0">
                      <p style="margin:0;color:#991b1b;font-weight:bold">
                        ❌ Votre demande a été annulée par le prestataire.
                      </p>
                      <p style="margin:8px 0 0;color:#7f1d1d;font-size:13px">
                        Ne vous découragez pas ! D'autres prestataires
                        sont disponibles sur Locavia pour vous aider.
                      </p>
                    </div>
                    <p style="color:#4b5563">
                      Vous pouvez dès maintenant faire une nouvelle demande
                      auprès d'un autre prestataire ou choisir une autre date.
                    </p>
                    <div style="text-align:center;margin:24px 0">
                      <a href="%s/services"
                        style="background:#4f46e5;color:white;padding:14px 32px;
                               border-radius:8px;text-decoration:none;font-weight:bold">
                        Trouver un prestataire
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">
                      © 2024 Locavia · Tous droits réservés
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                demandeur.getPrenom(),
                prestataire.getPrenom(), prestataire.getNom(),
                demande.getProbleme() != null ? demande.getProbleme() : "service",
                demande.getDateService().toString(),
                demande.getHeureService().toString(),
                urlFrontend
        );

        envoyer(demandeur.getEmail(),
                "📋 Locavia — Mise à jour de votre demande de service", html);
    }

    // ── Mail changement avis : refusé → accepté ──────────
    @Async
    public void envoyerEmailChangementAvisAcceptation(
            Utilisateur demandeur,
            Utilisateur prestataire,
            com.locavia.backend.entity.DemandeService demande) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#22c55e;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">
                      🎉 Bonne nouvelle ! Votre demande a été acceptée !
                    </h2>
                    <p style="color:#374151">
                      Bonjour <strong>%s</strong>,
                    </p>
                    <p style="color:#4b5563">
                      Excellente nouvelle ! <strong>%s %s</strong>,
                      prestataire spécialisé en <em>%s</em>,
                      a reconsidéré sa décision et
                      <strong style="color:#16a34a">accepte maintenant</strong>
                      votre demande !
                    </p>
                    <div style="background:#f0fdf4;border-left:4px solid #22c55e;
                                border-radius:8px;padding:16px;margin:16px 0">
                      <p style="margin:0;color:#166534;font-weight:bold">
                        ✅ Intervention confirmée
                      </p>
                      <p style="margin:8px 0 0;color:#14532d;font-size:13px">
                        📅 Date : <strong>%s</strong><br>
                        🕐 Heure : <strong>%s</strong><br>
                        📍 Adresse : <strong>%s</strong>
                      </p>
                    </div>
                    <div style="background:#f8fafc;border-radius:12px;
                                padding:16px;margin:16px 0">
                      <p style="margin:0;color:#374151;font-weight:bold">
                        Contact prestataire :
                      </p>
                      <p style="margin:8px 0 0;color:#4b5563;font-size:13px">
                        👤 %s %s<br>
                        📞 %s<br>
                        📧 %s
                      </p>
                    </div>
                    <p style="color:#4b5563;font-size:13px">
                      Nous vous souhaitons une excellente expérience
                      avec votre prestataire Locavia !
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">
                      © 2024 Locavia · Tous droits réservés
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                demandeur.getPrenom(),
                prestataire.getPrenom(), prestataire.getNom(),
                demande.getProbleme() != null ? demande.getProbleme() : "service",
                demande.getDateService().toString(),
                demande.getHeureService().toString(),
                demande.getAdresse() != null ? demande.getAdresse() : "Non précisée",
                prestataire.getPrenom(), prestataire.getNom(),
                prestataire.getTelephone() != null
                        ? prestataire.getTelephone() : "Non renseigné",
                prestataire.getEmail()
        );

        envoyer(demandeur.getEmail(),
                "🎉 Locavia — Votre demande de service a été acceptée !", html);
    }

    @Async
    public void envoyerEmailAnnulationDemande(
            Utilisateur prestataire,
            Utilisateur demandeur,
            com.locavia.backend.entity.DemandeService demande) {

        String html = """
        <!DOCTYPE html><html lang="fr"><body
          style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 20px">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:white;border-radius:16px;overflow:hidden">
                <tr>
                  <td style="background:#f59e0b;padding:32px;text-align:center">
                    <h1 style="color:white;margin:0">🏠 Locavia</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px">
                    <h2 style="color:#111827;margin-top:0">
                      🗑️ Demande annulée par le client
                    </h2>
                    <p style="color:#374151">
                      Bonjour <strong>%s</strong>,
                    </p>
                    <p style="color:#4b5563">
                      <strong>%s %s</strong> a annulé sa demande de service
                      prévue le <strong>%s à %s</strong>.
                    </p>
                    <div style="background:#fffbeb;border-left:4px solid #f59e0b;
                                border-radius:8px;padding:16px;margin:16px 0">
                      <p style="margin:0;color:#92400e;">
                        Ce créneau est maintenant de nouveau disponible
                        dans votre calendrier.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0">
                      © 2024 Locavia
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """.formatted(
                prestataire.getPrenom(),
                demandeur.getPrenom(), demandeur.getNom(),
                demande.getDateService().toString(),
                demande.getHeureService().toString()
        );

        envoyer(prestataire.getEmail(),
                "🗑️ Locavia — Demande annulée", html);
    }
}