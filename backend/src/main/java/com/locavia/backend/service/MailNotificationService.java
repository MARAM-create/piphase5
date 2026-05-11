package com.locavia.backend.service;
import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.entity.DemandeLocation;
import com.locavia.backend.entity.Utilisateur;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailNotificationService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String expediteur;

    public void notifierNouvelleDemande(DemandeLocation demande) {
        envoyerMailEtudiant(demande);
        envoyerMailProprietaire(demande);
    }

    private void envoyerMailEtudiant(DemandeLocation demande) {
        Utilisateur etudiant = demande.getEtudiant();
        AnnonceLocation annonce = demande.getAnnonce();

        if (etudiant == null || etudiant.getEmail() == null || etudiant.getEmail().isBlank()) {
            return;
        }

        String prenom = etudiant.getPrenom() != null ? etudiant.getPrenom() : "";
        String titreAnnonce = annonce != null && annonce.getTitre() != null
                ? annonce.getTitre()
                : "le logement sélectionné";

        String sujet = "Confirmation de votre demande - Locavia";

        String contenu =
                "Bonjour " + prenom + ",\n\n" +
                        "Votre demande de location a bien été envoyée avec succès.\n\n" +
                        "Annonce concernée : " + titreAnnonce + "\n" +
                        "Statut actuel : En attente de réponse du propriétaire\n\n" +
                        "Vous pouvez suivre l’état de votre demande depuis votre espace étudiant Locavia.\n\n" +
                        "Merci d’utiliser Locavia.\n\n" +
                        "L’équipe Locavia";

        envoyerEmail(etudiant.getEmail(), sujet, contenu);
    }

    private void envoyerMailProprietaire(DemandeLocation demande) {
        Utilisateur etudiant = demande.getEtudiant();
        AnnonceLocation annonce = demande.getAnnonce();

        if (annonce == null || annonce.getProprietaire() == null) {
            return;
        }

        Utilisateur proprietaire = annonce.getProprietaire();

        if (proprietaire.getEmail() == null || proprietaire.getEmail().isBlank()) {
            return;
        }

        String prenomProprietaire = proprietaire.getPrenom() != null
                ? proprietaire.getPrenom()
                : "";

        String titreAnnonce = annonce.getTitre() != null
                ? annonce.getTitre()
                : "votre annonce";

        String nomEtudiant = construireNomComplet(etudiant);

        String sujet = "Nouvelle demande reçue - Locavia";

        String contenu =
                "Bonjour " + prenomProprietaire + ",\n\n" +
                        "Vous avez reçu une nouvelle demande pour votre annonce.\n\n" +
                        "Annonce : " + titreAnnonce + "\n" +
                        "Candidat : " + nomEtudiant + "\n" +
                        "Nombre de personnes : " + valeur(demande.getNombrePersonnes()) + "\n" +
                        "Date d’entrée souhaitée : " + valeur(demande.getDateEntree()) + "\n" +
                        "Type de visite : " + valeur(demande.getTypeVisite()) + "\n\n" +
                        "Pour consulter tous les détails et répondre à la demande, connectez-vous à votre espace propriétaire Locavia.\n\n" +
                        "L’équipe Locavia";

        envoyerEmail(proprietaire.getEmail(), sujet, contenu);
    }

    private void envoyerEmail(String destinataire, String sujet, String contenu) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(expediteur);
            message.setTo(destinataire);
            message.setSubject(sujet);
            message.setText(contenu);

            mailSender.send(message);

            System.out.println("Email envoyé à : " + destinataire);
        } catch (Exception e) {
            System.err.println("Erreur envoi email à " + destinataire + " : " + e.getMessage());
        }
    }

    private String construireNomComplet(Utilisateur utilisateur) {
        if (utilisateur == null) {
            return "Étudiant";
        }

        String prenom = utilisateur.getPrenom() != null ? utilisateur.getPrenom() : "";
        String nom = utilisateur.getNom() != null ? utilisateur.getNom() : "";

        String nomComplet = (prenom + " " + nom).trim();

        return nomComplet.isBlank() ? "Étudiant" : nomComplet;
    }

    private String valeur(Object valeur) {
        return valeur != null ? valeur.toString() : "Non précisé";
    }
}
