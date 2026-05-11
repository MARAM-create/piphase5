package com.locavia.backend.service;

/**
 * Service d'envoi d'emails.
 * Gère l'envoi d'emails simples et d'emails avec pièces jointes (factures PDF).
 */
public interface IEmailService {

    /**
     * Envoie un email simple (texte).
     *
     * @param destinataire adresse email du destinataire
     * @param sujet        sujet de l'email
     * @param contenu      corps du message
     */
    void envoyerEmail(String destinataire, String sujet, String contenu);

    /**
     * Envoie un email avec une pièce jointe PDF.
     *
     * @param destinataire   adresse email du destinataire
     * @param sujet          sujet de l'email
     * @param contenu        corps du message (HTML)
     * @param pdfBytes       contenu du fichier PDF
     * @param nomFichierPdf  nom du fichier PDF attaché
     */
    void envoyerEmailAvecPieceJointe(String destinataire, String sujet, String contenu,
                                      byte[] pdfBytes, String nomFichierPdf);
}
