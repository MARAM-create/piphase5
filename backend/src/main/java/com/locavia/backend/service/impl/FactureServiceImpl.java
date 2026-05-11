package com.locavia.backend.service.impl;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.locavia.backend.entity.TransactionPaiement;
import com.locavia.backend.service.IFactureService;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/**
 * Implémentation du service de génération de factures PDF.
 * Utilise iText 8 pour produire un document PDF professionnel
 * avec en-tête Locavia, détails de la transaction et pied de page.
 */
@Service
@Slf4j
public class FactureServiceImpl implements IFactureService {

    // ── Couleurs de la charte Locavia ─────────────────────────
    private static final DeviceRgb BLEU_FONCE = new DeviceRgb(15, 23, 42);      // #0F172A
    private static final DeviceRgb BLEU_ACCENT = new DeviceRgb(30, 58, 95);     // #1E3A5F
    private static final DeviceRgb VERT_SUCCES = new DeviceRgb(52, 211, 153);   // #34D399
    private static final DeviceRgb GRIS_CLAIR = new DeviceRgb(241, 245, 249);   // #F1F5F9
    private static final DeviceRgb GRIS_TEXTE = new DeviceRgb(100, 116, 139);   // #64748B

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");

    // ══════════════════════════════════════════════════════════
    //  Génération de la facture PDF
    // ══════════════════════════════════════════════════════════

    @Override
    public byte[] genererFacturePdf(TransactionPaiement transaction) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(40, 40, 40, 40);

            PdfFont fontRegular = PdfFontFactory.createFont("Helvetica");
            PdfFont fontBold = PdfFontFactory.createFont("Helvetica-Bold");

            // ── En-tête Locavia ──────────────────────────────
            ajouterEnTete(document, fontBold, fontRegular, transaction);

            // ── Séparateur ───────────────────────────────────
            document.add(new Paragraph("")
                    .setBorderBottom(new SolidBorder(VERT_SUCCES, 2))
                    .setMarginBottom(20));

            // ── Informations client ──────────────────────────
            ajouterInfoClient(document, fontBold, fontRegular, transaction);

            // ── Tableau des détails ──────────────────────────
            ajouterTableauDetails(document, fontBold, fontRegular, transaction);

            // ── Montant total ────────────────────────────────
            ajouterMontantTotal(document, fontBold, transaction);

            // ── Pied de page ─────────────────────────────────
            ajouterPiedDePage(document, fontRegular);

            document.close();

            log.info("📄 Facture PDF générée pour la transaction id={}, contrat id={}",
                    transaction.getId(),
                    transaction.getContrat() != null ? transaction.getContrat().getId() : "N/A");

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération de la facture PDF pour la transaction id={}",
                    transaction.getId(), e);
            throw new RuntimeException(
                    "Impossible de générer la facture PDF pour la transaction id=" + transaction.getId(), e);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Sections du document
    // ══════════════════════════════════════════════════════════

    private void ajouterEnTete(Document document, PdfFont fontBold, PdfFont fontRegular,
                                TransactionPaiement transaction) {
        // Logo / Titre
        Paragraph logo = new Paragraph("LOCAVIA")
                .setFont(fontBold)
                .setFontSize(28)
                .setFontColor(BLEU_FONCE)
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(2);
        document.add(logo);

        Paragraph slogan = new Paragraph("Plateforme de Location Immobilière")
                .setFont(fontRegular)
                .setFontSize(10)
                .setFontColor(GRIS_TEXTE)
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(15);
        document.add(slogan);

        // Titre de la facture
        Paragraph titre = new Paragraph("FACTURE DE PAIEMENT")
                .setFont(fontBold)
                .setFontSize(20)
                .setFontColor(BLEU_ACCENT)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(titre);

        // Numéro et date
        String dateFormatee = transaction.getDatePaiement() != null
                ? transaction.getDatePaiement().format(DATE_FORMATTER)
                : "N/A";

        Paragraph numero = new Paragraph("Facture N° FAC-" + transaction.getId()
                + "  |  Date : " + dateFormatee)
                .setFont(fontRegular)
                .setFontSize(10)
                .setFontColor(GRIS_TEXTE)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(numero);
    }

    private void ajouterInfoClient(Document document, PdfFont fontBold, PdfFont fontRegular,
                                    TransactionPaiement transaction) {
        Paragraph labelClient = new Paragraph("FACTURÉ À :")
                .setFont(fontBold)
                .setFontSize(10)
                .setFontColor(BLEU_ACCENT)
                .setMarginBottom(5);
        document.add(labelClient);

        String nomClient = transaction.getClient() != null
                ? transaction.getClient().getPrenom() + " " + transaction.getClient().getNom() : "Client inconnu";
        String emailClient = transaction.getClient() != null
                ? transaction.getClient().getEmail() : "N/A";

        Table clientTable = new Table(UnitValue.createPercentArray(1)).useAllAvailableWidth();
        clientTable.setBackgroundColor(GRIS_CLAIR);
        clientTable.setMarginBottom(20);

        Cell clientCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(15);
        clientCell.add(new Paragraph(nomClient).setFont(fontBold).setFontSize(12).setFontColor(BLEU_FONCE));
        clientCell.add(new Paragraph(emailClient).setFont(fontRegular).setFontSize(10).setFontColor(GRIS_TEXTE));
        clientTable.addCell(clientCell);

        document.add(clientTable);
    }

    private void ajouterTableauDetails(Document document, PdfFont fontBold, PdfFont fontRegular,
                                        TransactionPaiement transaction) {
        Paragraph labelDetails = new Paragraph("DÉTAILS DE LA TRANSACTION")
                .setFont(fontBold)
                .setFontSize(10)
                .setFontColor(BLEU_ACCENT)
                .setMarginBottom(10);
        document.add(labelDetails);

        // Tableau à deux colonnes (Libellé / Valeur)
        Table table = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                .useAllAvailableWidth()
                .setMarginBottom(20);

        // En-tête du tableau
        ajouterCelluleEntete(table, "Libellé", fontBold);
        ajouterCelluleEntete(table, "Valeur", fontBold);

        // Lignes de données
        ajouterLigneDonnees(table, "Transaction ID", String.valueOf(transaction.getId()), fontRegular);

        String contratId = transaction.getContrat() != null
                ? String.valueOf(transaction.getContrat().getId()) : "N/A";
        ajouterLigneDonnees(table, "Contrat ID", contratId, fontRegular);

        ajouterLigneDonnees(table, "Session Stripe",
                transaction.getStripeSessionId() != null
                        ? transaction.getStripeSessionId().substring(0, Math.min(30, transaction.getStripeSessionId().length())) + "..."
                        : "N/A",
                fontRegular);

        ajouterLigneDonnees(table, "Montant",
                transaction.getMontantTotal() + " EUR", fontRegular);

        String dateStr = transaction.getDatePaiement() != null
                ? transaction.getDatePaiement().format(DATE_FORMATTER) : "N/A";
        ajouterLigneDonnees(table, "Date de paiement", dateStr, fontRegular);

        ajouterLigneDonnees(table, "Statut",
                transaction.getStatutPaiement() != null
                        ? transaction.getStatutPaiement().name() : "N/A",
                fontRegular);

        // Titre de l'annonce
        String titreAnnonce = (transaction.getContrat() != null
                && transaction.getContrat().getAnnonce() != null)
                ? transaction.getContrat().getAnnonce().getTitre() : "N/A";
        ajouterLigneDonnees(table, "Bien loué", titreAnnonce, fontRegular);

        document.add(table);
    }

    private void ajouterMontantTotal(Document document, PdfFont fontBold,
                                      TransactionPaiement transaction) {
        Table totalTable = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .useAllAvailableWidth()
                .setMarginBottom(30);

        Cell emptyCell = new Cell().setBorder(Border.NO_BORDER);
        totalTable.addCell(emptyCell);

        Cell totalCell = new Cell()
                .setBackgroundColor(BLEU_FONCE)
                .setPadding(15)
                .setBorder(Border.NO_BORDER);
        totalCell.add(new Paragraph("TOTAL PAYÉ")
                .setFont(fontBold).setFontSize(10).setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(5));
        totalCell.add(new Paragraph(transaction.getMontantTotal() + " EUR")
                .setFont(fontBold).setFontSize(22).setFontColor(VERT_SUCCES)
                .setTextAlignment(TextAlignment.CENTER));
        totalTable.addCell(totalCell);

        document.add(totalTable);
    }

    private void ajouterPiedDePage(Document document, PdfFont fontRegular) {
        document.add(new Paragraph("")
                .setBorderTop(new SolidBorder(GRIS_CLAIR, 1))
                .setMarginTop(20)
                .setMarginBottom(10));

        Paragraph footer = new Paragraph(
                "Locavia — Plateforme de Location Immobilière\n"
                        + "Ce document est généré automatiquement et fait office de justificatif de paiement.\n"
                        + "Pour toute question, contactez-nous à support@locavia.tn")
                .setFont(fontRegular)
                .setFontSize(8)
                .setFontColor(GRIS_TEXTE)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(footer);
    }

    // ══════════════════════════════════════════════════════════
    //  Utilitaires tableau
    // ══════════════════════════════════════════════════════════

    private void ajouterCelluleEntete(Table table, String texte, PdfFont fontBold) {
        Cell cell = new Cell()
                .setBackgroundColor(BLEU_ACCENT)
                .setPadding(10)
                .setBorder(Border.NO_BORDER);
        cell.add(new Paragraph(texte)
                .setFont(fontBold).setFontSize(10).setFontColor(ColorConstants.WHITE));
        table.addHeaderCell(cell);
    }

    private void ajouterLigneDonnees(Table table, String libelle, String valeur, PdfFont font) {
        Cell cellLibelle = new Cell()
                .setPadding(8)
                .setBorderBottom(new SolidBorder(GRIS_CLAIR, 0.5f))
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setBorderTop(Border.NO_BORDER);
        cellLibelle.add(new Paragraph(libelle).setFont(font).setFontSize(10).setFontColor(GRIS_TEXTE));
        table.addCell(cellLibelle);

        Cell cellValeur = new Cell()
                .setPadding(8)
                .setBorderBottom(new SolidBorder(GRIS_CLAIR, 0.5f))
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setBorderTop(Border.NO_BORDER);
        cellValeur.add(new Paragraph(valeur).setFont(font).setFontSize(10).setFontColor(BLEU_FONCE));
        table.addCell(cellValeur);
    }
}
