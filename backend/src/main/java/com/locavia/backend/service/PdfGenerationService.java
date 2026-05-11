package com.locavia.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.io.font.constants.StandardFonts;
import com.locavia.backend.entity.ContratLocation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service de génération de documents PDF pour les contrats de location.
 * Utilise iText 7 pour produire un contrat vierge (pré-rempli) au format PDF.
 */
@Service
@Slf4j
public class PdfGenerationService {

    private static final String UPLOAD_DIR = "uploads/contrats";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Génère un PDF de contrat de location vierge avec les informations dynamiques
     * du bailleur, locataire, annonce, loyer et caution.
     *
     * @param contrat l'entité ContratLocation (avec relations chargées)
     * @return le chemin relatif du fichier PDF généré
     * @throws IOException si la création du fichier ou du répertoire échoue
     */
    public String generateContratViergePdf(ContratLocation contrat) throws IOException {
        // Créer le répertoire de sortie s'il n'existe pas
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Répertoire de sortie créé : {}", uploadPath.toAbsolutePath());
        }

        String fileName = "contrat_" + contrat.getId() + ".pdf";
        String filePath = UPLOAD_DIR + "/" + fileName;

        // Extraction sécurisée des données dynamiques avec Defensive Programming
        String bailleurNom = (contrat.getBailleur() != null)
                ? contrat.getBailleur().getPrenom() + " " + contrat.getBailleur().getNom() : "Bailleur : Non défini";

        String locataireNom = (contrat.getLocataire() != null)
                ? contrat.getLocataire().getPrenom() + " " + contrat.getLocataire().getNom() : "Locataire : Non défini";

        String annonceTitre = (contrat.getAnnonce() != null && contrat.getAnnonce().getTitre() != null)
                ? contrat.getAnnonce().getTitre() : "Annonce : Non définie";
        
        String loyer = (contrat.getAnnonce() != null && contrat.getAnnonce().getPrixMensuel() != null)
                ? contrat.getAnnonce().getPrixMensuel().toPlainString() : "0.00";
        String caution = (contrat.getAnnonce() != null && contrat.getAnnonce().getMontantCaution() != null)
                ? contrat.getAnnonce().getMontantCaution().toPlainString() : "0.00";
        String dateJour = LocalDate.now().format(DATE_FORMATTER);

        try (PdfWriter writer = new PdfWriter(filePath);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc, PageSize.A4)) {

            document.setMargins(50, 50, 50, 50);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            DeviceRgb primaryColor = new DeviceRgb(30, 58, 138);    // Bleu foncé
            DeviceRgb accentColor = new DeviceRgb(59, 130, 246);    // Bleu accent

            // ── EN-TÊTE ──────────────────────────────────────────
            document.add(new Paragraph("CONTRAT DE LOCATION")
                    .setFont(boldFont)
                    .setFontSize(22)
                    .setFontColor(primaryColor)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5));

            document.add(new Paragraph("Locavia — Plateforme de Location Immobilière")
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5));

            document.add(new Paragraph("Référence : CONTRAT-" + contrat.getId()
                    + " | Date : " + dateJour)
                    .setFont(regularFont)
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // ── Ligne de séparation ──────────────────────────────
            document.add(new Paragraph("─".repeat(80))
                    .setFontColor(accentColor)
                    .setFontSize(6)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15));

            // ── ARTICLE 1 : LES PARTIES ──────────────────────────
            document.add(new Paragraph("ARTICLE 1 — LES PARTIES")
                    .setFont(boldFont)
                    .setFontSize(13)
                    .setFontColor(primaryColor)
                    .setMarginBottom(10));

            Table partiesTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(15);

            // Cellule Bailleur
            Cell bailleurCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setPadding(10);
            bailleurCell.add(new Paragraph("LE BAILLEUR").setFont(boldFont).setFontSize(10)
                    .setFontColor(accentColor));
            bailleurCell.add(new Paragraph(bailleurNom).setFont(regularFont).setFontSize(11));
            bailleurCell.add(new Paragraph("(Propriétaire du bien)").setFont(regularFont)
                    .setFontSize(8).setFontColor(ColorConstants.GRAY));
            partiesTable.addCell(bailleurCell);

            // Cellule Locataire
            Cell locataireCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setPadding(10);
            locataireCell.add(new Paragraph("LE LOCATAIRE").setFont(boldFont).setFontSize(10)
                    .setFontColor(accentColor));
            locataireCell.add(new Paragraph(locataireNom).setFont(regularFont).setFontSize(11));
            locataireCell.add(new Paragraph("(Preneur du bien)").setFont(regularFont)
                    .setFontSize(8).setFontColor(ColorConstants.GRAY));
            partiesTable.addCell(locataireCell);

            document.add(partiesTable);

            // ── ARTICLE 2 : OBJET DU CONTRAT ────────────────────
            document.add(new Paragraph("ARTICLE 2 — OBJET DU CONTRAT")
                    .setFont(boldFont)
                    .setFontSize(13)
                    .setFontColor(primaryColor)
                    .setMarginBottom(8));

            document.add(new Paragraph(
                    "Le présent contrat a pour objet la location du bien immobilier désigné "
                            + "sous l'annonce « " + annonceTitre + " » référencée sur la plateforme Locavia. "
                            + "Le bailleur met à disposition du locataire le logement décrit dans ladite annonce, "
                            + "en l'état où il se trouve au jour de la remise des clés.")
                    .setFont(regularFont)
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(15));

            // ── ARTICLE 3 : CONDITIONS FINANCIÈRES ───────────────
            document.add(new Paragraph("ARTICLE 3 — CONDITIONS FINANCIÈRES")
                    .setFont(boldFont)
                    .setFontSize(13)
                    .setFontColor(primaryColor)
                    .setMarginBottom(10));

            Table financeTable = new Table(UnitValue.createPercentArray(new float[]{2, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(15);

            // En-têtes
            financeTable.addHeaderCell(new Cell().add(new Paragraph("Désignation")
                    .setFont(boldFont).setFontSize(10)).setBackgroundColor(new DeviceRgb(239, 246, 255)));
            financeTable.addHeaderCell(new Cell().add(new Paragraph("Montant (TND)")
                    .setFont(boldFont).setFontSize(10)).setBackgroundColor(new DeviceRgb(239, 246, 255)));

            // Loyer
            financeTable.addCell(new Cell().add(new Paragraph("Loyer mensuel")
                    .setFont(regularFont).setFontSize(10)));
            financeTable.addCell(new Cell().add(new Paragraph(loyer + " TND")
                    .setFont(boldFont).setFontSize(10).setFontColor(primaryColor)));

            // Caution
            financeTable.addCell(new Cell().add(new Paragraph("Dépôt de garantie (caution)")
                    .setFont(regularFont).setFontSize(10)));
            financeTable.addCell(new Cell().add(new Paragraph(caution + " TND")
                    .setFont(boldFont).setFontSize(10).setFontColor(primaryColor)));

            document.add(financeTable);

            document.add(new Paragraph(
                    "Le loyer est payable mensuellement, d'avance, au plus tard le 5 de chaque mois. "
                            + "Le dépôt de garantie sera restitué au locataire dans un délai de deux mois "
                            + "après la restitution des clés, déduction faite des éventuelles sommes dues.")
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(15));

            // ── ARTICLE 4 : OBLIGATIONS ──────────────────────────
            document.add(new Paragraph("ARTICLE 4 — OBLIGATIONS DES PARTIES")
                    .setFont(boldFont)
                    .setFontSize(13)
                    .setFontColor(primaryColor)
                    .setMarginBottom(8));

            document.add(new Paragraph(
                    "Le bailleur s'engage à délivrer un logement décent et en bon état d'usage. "
                            + "Le locataire s'engage à payer le loyer aux termes convenus, à user "
                            + "paisiblement des locaux et à les restituer dans l'état où il les a reçus, "
                            + "sauf usure normale.")
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(15));

            // ── ARTICLE 5 : RÉSILIATION ──────────────────────────
            document.add(new Paragraph("ARTICLE 5 — RÉSILIATION")
                    .setFont(boldFont)
                    .setFontSize(13)
                    .setFontColor(primaryColor)
                    .setMarginBottom(8));

            document.add(new Paragraph(
                    "Chaque partie peut résilier le présent contrat moyennant un préavis de trois (3) mois, "
                            + "notifié par lettre recommandée avec accusé de réception. En cas de manquement "
                            + "grave à l'une des obligations du présent contrat, la résiliation pourra être "
                            + "prononcée de plein droit après mise en demeure restée infructueuse.")
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(25));

            // ── SIGNATURES ───────────────────────────────────────
            document.add(new Paragraph("─".repeat(80))
                    .setFontColor(accentColor)
                    .setFontSize(6)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15));

            Table sigTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth();

            Cell sigBailleur = new Cell().setBorder(Border.NO_BORDER).setPadding(15);
            sigBailleur.add(new Paragraph("Le Bailleur").setFont(boldFont).setFontSize(10)
                    .setFontColor(primaryColor));
            sigBailleur.add(new Paragraph(bailleurNom).setFont(regularFont).setFontSize(10));
            sigBailleur.add(new Paragraph("\n\n____________________________")
                    .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY));
            sigBailleur.add(new Paragraph("Signature").setFont(regularFont).setFontSize(8)
                    .setFontColor(ColorConstants.GRAY));
            sigTable.addCell(sigBailleur);

            Cell sigLocataire = new Cell().setBorder(Border.NO_BORDER).setPadding(15);
            sigLocataire.add(new Paragraph("Le Locataire").setFont(boldFont).setFontSize(10)
                    .setFontColor(primaryColor));
            sigLocataire.add(new Paragraph(locataireNom).setFont(regularFont).setFontSize(10));
            sigLocataire.add(new Paragraph("\n\n____________________________")
                    .setFont(regularFont).setFontSize(9).setFontColor(ColorConstants.GRAY));
            sigLocataire.add(new Paragraph("Signature").setFont(regularFont).setFontSize(8)
                    .setFontColor(ColorConstants.GRAY));
            sigTable.addCell(sigLocataire);

            document.add(sigTable);

            // Pied de page
            document.add(new Paragraph("\nDocument généré automatiquement par Locavia — "
                    + dateJour + " — Ce document n'a pas de valeur légale sans les signatures des parties.")
                    .setFont(regularFont)
                    .setFontSize(7)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20));
        }

        log.info("PDF contrat généré avec succès : {}", filePath);
        return filePath;
    }
}

