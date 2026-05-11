package com.locavia.backend.service;


import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.security.*;
import com.locavia.backend.entity.DemandeLocation;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.Certificate;

@Service
public class PdfService {
    @Value("${pdf.keystore.path}")
    private Resource keystorePath;

    @Value("${pdf.keystore.password}")
    private String keystorePassword;

    @Value("${pdf.keystore.alias}")
    private String keystoreAlias;

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public byte[] genererPdfSigne(DemandeLocation demande) throws Exception {

        // Etape 1 — Générer le PDF non signé
        byte[] pdfNonSigne = genererPdfDemande(demande);

        // Etape 2 — Charger le keystore
        KeyStore keystore = KeyStore.getInstance("PKCS12");
        keystore.load(
                keystorePath.getInputStream(),
                keystorePassword.toCharArray()
        );

        PrivateKey privateKey = (PrivateKey) keystore.getKey(
                keystoreAlias,
                keystorePassword.toCharArray()
        );
        Certificate[] chain = keystore.getCertificateChain(keystoreAlias);

        // Etape 3 — Signer avec iText 5
        ByteArrayOutputStream signedOut = new ByteArrayOutputStream();
        PdfReader reader = new PdfReader(pdfNonSigne);

        PdfStamper stamper = PdfStamper.createSignature(
                reader, signedOut, '\0', null, true
        );

        PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
        appearance.setReason("Demande de location Locavia");
        appearance.setLocation("Tunis, Tunisie");
        appearance.setContact("contact@locavia.tn");

        // Zone visible de la signature en bas à gauche
        appearance.setVisibleSignature(
                new Rectangle(36, 30, 280, 80), 1, "Locavia-Sig"
        );

        // Style de la signature visible
        appearance.setRenderingMode(
                PdfSignatureAppearance.RenderingMode.DESCRIPTION
        );
        appearance.setLayer2Text(
                "Signé numériquement par\nLocavia\n" +
                        "Date : " + java.time.LocalDate.now() + "\n" +
                        "Référence : Demande #" + demande.getIdDemande()
        );
        appearance.setLayer2Font(
                new com.itextpdf.text.Font(
                        com.itextpdf.text.Font.FontFamily.HELVETICA, 8
                )
        );

        // Algorithme SHA256
        Security.addProvider(new BouncyCastleProvider());
        ExternalDigest digest = new BouncyCastleDigest();
        ExternalSignature signature = new PrivateKeySignature(
                privateKey,
                DigestAlgorithms.SHA256,
                BouncyCastleProvider.PROVIDER_NAME
        );

        MakeSignature.signDetached(
                appearance, digest, signature, chain,
                null, null, null, 0,
                MakeSignature.CryptoStandard.CMS
        );

        reader.close();
        return signedOut.toByteArray();
    }


    private void ajouterTitreSectionPro(Document doc, String titre,
                                        Font font, BaseColor bg) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);
        table.setSpacingAfter(4f);

        PdfPCell cell = new PdfPCell(new Phrase(titre, font));
        cell.setBackgroundColor(bg);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(10);
        cell.setPaddingBottom(10);
        cell.setPaddingLeft(10);

        table.addCell(cell);
        doc.add(table);
    }

    private void ajouterLignePro(PdfPTable table, String label, String valeur,
                                 Font fontLabel, Font fontValeur, BaseColor couleurBordure) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, fontLabel));
        cellLabel.setBorder(Rectangle.BOTTOM);
        cellLabel.setBorderColor(couleurBordure);
        cellLabel.setPaddingTop(8);
        cellLabel.setPaddingBottom(8);
        cellLabel.setPaddingLeft(6);

        PdfPCell cellValeur = new PdfPCell(new Phrase(valeur != null ? valeur : "—", fontValeur));
        cellValeur.setBorder(Rectangle.BOTTOM);
        cellValeur.setBorderColor(couleurBordure);
        cellValeur.setPaddingTop(8);
        cellValeur.setPaddingBottom(8);
        cellValeur.setPaddingLeft(6);

        table.addCell(cellLabel);
        table.addCell(cellValeur);
    }


    public byte[] genererPdfDemande(DemandeLocation demande) throws DocumentException {

        Document document = new Document(PageSize.A4, 36, 36, 40, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        // Palette plus pro
        BaseColor couleurPrimaire = new BaseColor(27, 67, 50);       // vert foncé
        BaseColor couleurSecondaire = new BaseColor(201, 169, 110);  // gold doux
        BaseColor couleurFondBloc = new BaseColor(248, 246, 242);    // beige clair
        BaseColor couleurTexte = new BaseColor(40, 40, 40);          // gris foncé
        BaseColor couleurLabel = new BaseColor(125, 125, 125);       // gris moyen
        BaseColor couleurBordure = new BaseColor(230, 225, 218);     // bordure légère
        BaseColor couleurBlanc = BaseColor.WHITE;

        // Fonts
        Font fontTitre = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, couleurBlanc);
        Font fontSousTitre = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, couleurSecondaire);
        Font fontSection = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, couleurPrimaire);
        Font fontLabel = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, couleurLabel);
        Font fontValeur = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, couleurTexte);
        Font fontNormal = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, couleurTexte);
        Font fontPetit = new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, couleurLabel);
        Font fontStatut = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);

        // HEADER
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{3, 1});
        header.setSpacingAfter(14f);

        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setBackgroundColor(couleurPrimaire);
        left.setPaddingTop(18);
        left.setPaddingBottom(18);
        left.setPaddingLeft(14);

        left.addElement(new Paragraph("Locavia", fontTitre));
        left.addElement(new Paragraph("Demande de location", fontSousTitre));

        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setBackgroundColor(couleurPrimaire);
        right.setPaddingTop(18);
        right.setPaddingBottom(18);
        right.setPaddingRight(14);

        Paragraph dateP = new Paragraph(
                demande.getDateDemande() != null
                        ? demande.getDateDemande().toLocalDate().toString()
                        : "—",
                new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.WHITE)
        );
        dateP.setAlignment(Element.ALIGN_RIGHT);

        Paragraph refP = new Paragraph(
                "Réf. #" + demande.getIdDemande(),
                new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, couleurSecondaire)
        );
        refP.setAlignment(Element.ALIGN_RIGHT);

        right.addElement(dateP);
        right.addElement(refP);

        header.addCell(left);
        header.addCell(right);
        document.add(header);

        // STATUT
        PdfPTable statutTable = new PdfPTable(1);
        statutTable.setWidthPercentage(100);
        statutTable.setSpacingAfter(12f);

        String statutLabel = "EN ATTENTE";
        BaseColor statutColor = couleurSecondaire;

        if (demande.getStatutDemande() != null) {
            switch (demande.getStatutDemande().toString()) {
                case "ACCEPTEE" -> {
                    statutLabel = "ACCEPTÉE";
                    statutColor = new BaseColor(52, 121, 89);
                }
                case "REFUSEE" -> {
                    statutLabel = "REFUSÉE";
                    statutColor = new BaseColor(162, 45, 45);
                }
            }
        }

        PdfPCell statutCell = new PdfPCell(new Phrase("Statut : " + statutLabel, fontStatut));
        statutCell.setBorder(Rectangle.NO_BORDER);
        statutCell.setBackgroundColor(statutColor);
        statutCell.setPadding(8);
        statutTable.addCell(statutCell);
        document.add(statutTable);

        // RESUME
        PdfPTable resumeTable = new PdfPTable(1);
        resumeTable.setWidthPercentage(100);
        resumeTable.setSpacingAfter(14f);

        PdfPCell resumeCell = new PdfPCell();
        resumeCell.setBackgroundColor(couleurFondBloc);
        resumeCell.setBorderColor(couleurBordure);
        resumeCell.setPadding(12);

        resumeCell.addElement(new Paragraph("Résumé de la demande", fontSection));

        String resume = "Demande pour "
                + (demande.getNombrePersonnes() != null ? demande.getNombrePersonnes() : "—")
                + " personne(s), entrée "
                + (demande.getDateEntree() != null ? demande.getDateEntree() : "—")
                + ", budget "
                + (demande.getBudget() != null ? demande.getBudget() + " DT" : "—")
                + ", préférence visite "
                + (demande.getTypeVisite() != null ? demande.getTypeVisite() : "—")
                + ".";

        resumeCell.addElement(new Paragraph(resume, fontNormal));
        resumeTable.addCell(resumeCell);
        document.add(resumeTable);

        // ETUDIANT
        ajouterTitreSectionPro(document, "Informations de l'étudiant", fontSection, couleurFondBloc);

        PdfPTable tableEtudiant = new PdfPTable(2);
        tableEtudiant.setWidthPercentage(100);
        tableEtudiant.setSpacingAfter(10f);

        if (demande.getEtudiant() != null) {
            ajouterLignePro(tableEtudiant, "Nom complet",
                    (demande.getEtudiant().getPrenom() != null ? demande.getEtudiant().getPrenom() : "")
                            + " "
                            + (demande.getEtudiant().getNom() != null ? demande.getEtudiant().getNom() : ""),
                    fontLabel, fontValeur, couleurBordure);

            ajouterLignePro(tableEtudiant, "Email",
                    demande.getEtudiant().getEmail() != null ? demande.getEtudiant().getEmail() : "—",
                    fontLabel, fontValeur, couleurBordure);

            ajouterLignePro(tableEtudiant, "Téléphone",
                    demande.getEtudiant().getTelephone() != null ? demande.getEtudiant().getTelephone() : "—",
                    fontLabel, fontValeur, couleurBordure);
        }

        document.add(tableEtudiant);

        // ANNONCE
        ajouterTitreSectionPro(document, "Logement concerné", fontSection, couleurFondBloc);

        PdfPTable tableAnnonce = new PdfPTable(2);
        tableAnnonce.setWidthPercentage(100);
        tableAnnonce.setSpacingAfter(10f);

        if (demande.getAnnonce() != null) {
            ajouterLignePro(tableAnnonce, "Titre",
                    demande.getAnnonce().getTitre() != null ? demande.getAnnonce().getTitre() : "—",
                    fontLabel, fontValeur, couleurBordure);

            ajouterLignePro(tableAnnonce, "Loyer",
                    demande.getAnnonce().getPrixMensuel() != null
                            ? demande.getAnnonce().getPrixMensuel() + " DT / mois"
                            : "—",
                    fontLabel, fontValeur, couleurBordure);

            ajouterLignePro(tableAnnonce, "Surface",
                    demande.getAnnonce().getSurface() != null
                            ? demande.getAnnonce().getSurface() + " m²"
                            : "—",
                    fontLabel, fontValeur, couleurBordure);
        }

        document.add(tableAnnonce);

        // PREFERENCES
        ajouterTitreSectionPro(document, "Préférences de location", fontSection, couleurFondBloc);

        PdfPTable tablePrefs = new PdfPTable(2);
        tablePrefs.setWidthPercentage(100);
        tablePrefs.setSpacingAfter(10f);

        ajouterLignePro(tablePrefs, "Nombre de personnes",
                demande.getNombrePersonnes() != null ? demande.getNombrePersonnes() + " personne(s)" : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Date d'entrée",
                demande.getDateEntree() != null ? demande.getDateEntree().toString() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Durée",
                demande.getDureeLocation() != null ? demande.getDureeLocation() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Budget",
                demande.getBudget() != null ? demande.getBudget() + " DT" : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Ville actuelle",
                demande.getVilleActuelle() != null ? demande.getVilleActuelle() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Critère principal",
                demande.getCriterePrincipal() != null ? demande.getCriterePrincipal() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Besoin principal",
                demande.getBesoinPrincipal() != null ? demande.getBesoinPrincipal() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tablePrefs, "Remarque logement",
                demande.getRemarqueLogement() != null ? demande.getRemarqueLogement() : "—",
                fontLabel, fontValeur, couleurBordure);

        document.add(tablePrefs);

        // VISITE
        ajouterTitreSectionPro(document, "Informations sur la visite", fontSection, couleurFondBloc);

        PdfPTable tableVisite = new PdfPTable(2);
        tableVisite.setWidthPercentage(100);
        tableVisite.setSpacingAfter(10f);

        ajouterLignePro(tableVisite, "Type de visite",
                demande.getTypeVisite() != null ? demande.getTypeVisite().name() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tableVisite, "Format de visite",
                demande.getFormatVisite() != null ? demande.getFormatVisite().name() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tableVisite, "Moment de visite",
                demande.getMomentVisite() != null ? demande.getMomentVisite() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tableVisite, "Date souhaitée",
                demande.getDateSouhaitee() != null ? demande.getDateSouhaitee().toString() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tableVisite, "Jours disponibles",
                demande.getJoursDisponibles() != null ? demande.getJoursDisponibles() : "—",
                fontLabel, fontValeur, couleurBordure);

        ajouterLignePro(tableVisite, "Plage horaire",
                demande.getPlageHoraire() != null ? demande.getPlageHoraire() : "—",
                fontLabel, fontValeur, couleurBordure);



        ajouterLignePro(tableVisite, "Remarque disponibilité",
                demande.getRemarqueDisponibilite() != null ? demande.getRemarqueDisponibilite() : "—",
                fontLabel, fontValeur, couleurBordure);

        document.add(tableVisite);

        // MESSAGE
        ajouterTitreSectionPro(document, "Message du candidat", fontSection, couleurFondBloc);

        PdfPTable tableMessage = new PdfPTable(1);
        tableMessage.setWidthPercentage(100);
        tableMessage.setSpacingAfter(12f);

        PdfPCell messageCell = new PdfPCell(new Phrase(
                demande.getMessageCandidat() != null ? demande.getMessageCandidat() : "—",
                fontNormal
        ));
        messageCell.setPadding(12);
        messageCell.setBorderColor(couleurBordure);
        messageCell.setBackgroundColor(BaseColor.WHITE);
        tableMessage.addCell(messageCell);
        document.add(tableMessage);

        // SIGNATURE / VALIDATION
        PdfPTable signatureTable = new PdfPTable(1);
        signatureTable.setWidthPercentage(100);
        signatureTable.setSpacingBefore(20f);

        PdfPCell signatureCell = new PdfPCell();
        signatureCell.setBackgroundColor(couleurFondBloc);
        signatureCell.setBorderColor(couleurBordure);
        signatureCell.setPadding(12);

        signatureCell.addElement(new Paragraph("Validation Locavia", fontSection));
        signatureCell.addElement(new Paragraph(
                "Document généré automatiquement par Locavia.\n" +
                        "Ce document atteste l'enregistrement de la demande de location.\n" +
                        "Date de génération : " + java.time.LocalDate.now(),
                fontNormal
        ));

        Paragraph ligneSig = new Paragraph("______________________________", fontPetit);
        ligneSig.setSpacingBefore(10f);
        signatureCell.addElement(ligneSig);

        Paragraph nomSig = new Paragraph("Signature numérique Locavia", fontPetit);
        signatureCell.addElement(nomSig);

        signatureTable.addCell(signatureCell);
        document.add(signatureTable);

        // FOOTER
        document.add(Chunk.NEWLINE);

        PdfPTable footer = new PdfPTable(1);
        footer.setWidthPercentage(100);

        PdfPCell footerCell = new PdfPCell(new Phrase(
                "Document officiel généré par Locavia — locavia.tn",
                fontPetit
        ));
        footerCell.setBorder(Rectangle.TOP);
        footerCell.setBorderColor(couleurBordure);
        footerCell.setPaddingTop(8);
        footerCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        footer.addCell(footerCell);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    private void ajouterTitreSection(Document doc, String titre,
                                     Font font, BaseColor bg) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(titre, font));
        cell.setBackgroundColor(bg);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBorderWidthBottom(1);
        cell.setBorderColorBottom(new BaseColor(232, 221, 210));
        cell.setPadding(8);
        table.addCell(cell);
        doc.add(table);
    }

    private void ajouterLigne(PdfPTable table, String label, String valeur,
                              Font fontLabel, Font fontValeur) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, fontLabel));
        cellLabel.setBorder(Rectangle.NO_BORDER);
        cellLabel.setPadding(6);
        cellLabel.setBorderWidthBottom(0.5f);
        cellLabel.setBorderColorBottom(new BaseColor(232, 221, 210));

        PdfPCell cellValeur = new PdfPCell(new Phrase(valeur, fontValeur));
        cellValeur.setBorder(Rectangle.NO_BORDER);
        cellValeur.setPadding(6);
        cellValeur.setBorderWidthBottom(0.5f);
        cellValeur.setBorderColorBottom(new BaseColor(232, 221, 210));

        table.addCell(cellLabel);
        table.addCell(cellValeur);
    }

}
