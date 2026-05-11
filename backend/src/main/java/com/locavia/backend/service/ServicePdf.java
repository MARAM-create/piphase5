package com.locavia.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.layout.element.Image;
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
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.BorderRadius;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.locavia.backend.dto.MeubleResponseDTO;
import com.locavia.backend.entity.RecuAchat;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.repository.RecuAchatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class ServicePdf {

    @Value("${application.url-frontend:http://localhost:4200}")
    private String urlFrontend;

    private final RecuAchatRepository recuRepository;

    private static final DeviceRgb VERT_PRINCIPAL   = new DeviceRgb(28, 122, 72);
    private static final DeviceRgb VERT_FONCE       = new DeviceRgb(16, 80, 49);
    private static final DeviceRgb VERT_CLAIR       = new DeviceRgb(243, 250, 245);
    private static final DeviceRgb VERT_BORDURE     = new DeviceRgb(186, 224, 195);

    private static final DeviceRgb ORANGE_PRINCIPAL = new DeviceRgb(245, 124, 32);
    private static final DeviceRgb ORANGE_CLAIR     = new DeviceRgb(255, 247, 240);

    private static final DeviceRgb GRIS_TEXTE       = new DeviceRgb(46, 58, 52);
    private static final DeviceRgb GRIS_SECONDAIRE  = new DeviceRgb(110, 128, 116);
    private static final DeviceRgb GRIS_BORDER      = new DeviceRgb(223, 231, 224);
    private static final DeviceRgb GRIS_BG          = new DeviceRgb(248, 250, 248);
    private static final DeviceRgb BLANC_CASSE      = new DeviceRgb(252, 252, 250);

    public byte[] genererRecuAchat(
            MeubleResponseDTO meuble,
            Utilisateur acheteur,
            Utilisateur transporteur
    ) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(18, 22, 18, 22);

            PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont fontNormal = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont fontOblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            String numeroRecu = "LOC-2024-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            String dateAchatAffichage = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"));
            String dateAchatStockage = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

            String contenu = numeroRecu + meuble.getTitre() + acheteur.getEmail() + dateAchatStockage;
            String hash = genererHash(contenu);

            String urlVerif = urlFrontend + "/verification/" + numeroRecu;

            try {
                RecuAchat recu = RecuAchat.builder()
                        .numeroRecu(numeroRecu)
                        .hashSha256(hash)
                        .titreMeuble(meuble.getTitre())
                        .prixMeuble(meuble.getPrix())
                        .nomAcheteur(acheteur.getPrenom() + " " + acheteur.getNom())
                        .emailAcheteur(acheteur.getEmail())
                        .nomVendeur(meuble.getVendeurPrenom() + " " + meuble.getVendeurNom())
                        .nomTransporteur(
                                transporteur != null
                                        ? transporteur.getPrenom() + " " + transporteur.getNom()
                                        : null
                        )
                        .valide(true)
                        .build();

                recuRepository.save(recu);
            } catch (Exception e) {
                System.err.println("Erreur sauvegarde reçu : " + e.getMessage());
            }

            ajouterHeader(document, fontBold, fontNormal, numeroRecu, dateAchatAffichage);
            ajouterBandeauStatut(document, fontBold, fontNormal);

            document.add(creerSectionTableau(
                    "Informations du document",
                    new String[][]{
                            {"Numéro du reçu", numeroRecu},
                            {"Date d'achat", dateAchatAffichage},
                            {"Émetteur", "Locavia Platform"},
                            {"Statut", "Achat confirmé"}
                    },
                    fontBold,
                    fontNormal
            ));

            document.add(creerSectionTableau(
                    "Détails du meuble",
                    new String[][]{
                            {"Titre", safe(meuble.getTitre())},
                            {"Catégorie", safe(meuble.getCategorie())},
                            {"État", formaterEtat(meuble)},
                            {"Ville", safe(meuble.getVille())},
                            {"Description", safe(meuble.getDescription())}
                    },
                    fontBold,
                    fontNormal
            ));

            document.add(creerBlocMontant(meuble.getPrix(), fontBold, fontNormal));

            document.add(creerBlocAcheteurVendeur(
                    acheteur,
                    meuble,
                    fontBold,
                    fontNormal
            ));

            if (transporteur != null) {
                document.add(creerBlocTransporteur(
                        transporteur,
                        fontBold,
                        fontNormal
                ));
            }

            ajouterBlocSignature(document, fontBold, fontNormal, fontOblique, numeroRecu, hash, urlVerif);
            ajouterFooter(document, fontNormal, fontOblique);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF : " + e.getMessage(), e);
        }
    }

    private void ajouterHeader(
            Document document,
            PdfFont fontBold,
            PdfFont fontNormal,
            String numeroRecu,
            String dateAchat
    ) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1.45f, 1f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(8);

        Cell left = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(0);

        try {
            byte[] logoBytes = new ClassPathResource("logo-locavia.png")
                    .getInputStream()
                    .readAllBytes();

            Image logo = new Image(ImageDataFactory.create(logoBytes));
            logo.setWidth(220);
            logo.setAutoScaleHeight(true);
            left.add(logo);
        } catch (Exception e) {
            left.add(new Paragraph("LOCAVIA")
                    .setFont(fontBold)
                    .setFontSize(26)
                    .setFontColor(VERT_FONCE)
                    .setMarginBottom(2));
        }

        left.add(new Paragraph("Plateforme sécurisée de location et colocation entre particuliers")
                .setFont(fontNormal)
                .setFontSize(8.5f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMarginTop(2)
                .setMarginBottom(0));

        Cell right = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(0)
                .setTextAlignment(TextAlignment.RIGHT)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        right.add(new Paragraph("REÇU D’ACHAT")
                .setFont(fontBold)
                .setFontSize(19)
                .setFontColor(VERT_FONCE)
                .setMarginBottom(6));

        right.add(new Paragraph("N° " + numeroRecu)
                .setFont(fontBold)
                .setFontSize(13)
                .setFontColor(ORANGE_PRINCIPAL)
                .setMarginBottom(6));

        right.add(new Paragraph("Date : " + dateAchat)
                .setFont(fontNormal)
                .setFontSize(10)
                .setFontColor(GRIS_SECONDAIRE)
                .setMargin(0));

        header.addCell(left);
        header.addCell(right);

        document.add(header);

        Table line = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(2)
                .setMarginBottom(10);

        line.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setHeight(2)
                .setBackgroundColor(VERT_PRINCIPAL));

        line.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setHeight(2)
                .setBackgroundColor(ORANGE_PRINCIPAL));

        document.add(line);
    }

    private void ajouterBandeauStatut(Document document, PdfFont fontBold, PdfFont fontNormal) {
        Table bandeau = new Table(UnitValue.createPercentArray(new float[]{0.14f, 0.70f, 0.16f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(VERT_CLAIR)
                .setBorder(new SolidBorder(VERT_BORDURE, 1))
                .setBorderRadius(new BorderRadius(10))
                .setMarginBottom(10);

        Cell iconCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        iconCell.add(new Paragraph("✔")
                .setFont(fontBold)
                .setFontSize(20)
                .setFontColor(VERT_PRINCIPAL)
                .setBackgroundColor(new DeviceRgb(220, 243, 225))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorderRadius(new BorderRadius(30))
                .setWidth(34)
                .setHeight(34)
                .setMarginLeft(18));

        Cell textCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(10)
                .setPaddingBottom(10)
                .setPaddingLeft(0)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        textCell.add(new Paragraph("ACHAT CONFIRMÉ")
                .setFont(fontBold)
                .setFontSize(14)
                .setFontColor(VERT_PRINCIPAL)
                .setMarginBottom(2));

        textCell.add(new Paragraph("Ce document atteste que l’achat de ce meuble a bien été effectué sur la plateforme Locavia.")
                .setFont(fontNormal)
                .setFontSize(9)
                .setFontColor(GRIS_SECONDAIRE)
                .setMargin(0));

        Cell shieldCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        shieldCell.add(new Paragraph("🛡")
                .setFont(fontNormal)
                .setFontSize(22)
                .setFontColor(new DeviceRgb(210, 235, 214))
                .setMargin(0));

        bandeau.addCell(iconCell);
        bandeau.addCell(textCell);
        bandeau.addCell(shieldCell);

        document.add(bandeau);
    }

    private Table creerSectionTableau(
            String titre,
            String[][] lignes,
            PdfFont fontBold,
            PdfFont fontNormal
    ) {
        Table wrapper = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(8);

        Cell titleCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(1)
                .setPaddingBottom(5)
                .setPaddingLeft(0)
                .setPaddingRight(0);

        titleCell.add(new Paragraph(titre.toUpperCase())
                .setFont(fontBold)
                .setFontSize(11.5f)
                .setFontColor(VERT_FONCE)
                .setMargin(0));

        wrapper.addCell(titleCell);

        Table table = new Table(UnitValue.createPercentArray(new float[]{0.34f, 0.66f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(new SolidBorder(GRIS_BORDER, 1))
                .setBorderRadius(new BorderRadius(8));

        for (String[] ligne : lignes) {
            Cell label = new Cell()
                    .setBackgroundColor(new DeviceRgb(247, 251, 248))
                    .setBorder(new SolidBorder(GRIS_BORDER, 1))
                    .setPaddingTop(6)
                    .setPaddingBottom(6)
                    .setPaddingLeft(8)
                    .setPaddingRight(8);

            label.add(new Paragraph(ligne[0])
                    .setFont(fontBold)
                    .setFontSize(8.5f)
                    .setFontColor(VERT_PRINCIPAL)
                    .setMargin(0));

            Cell value = new Cell()
                    .setBorder(new SolidBorder(GRIS_BORDER, 1))
                    .setPaddingTop(6)
                    .setPaddingBottom(6)
                    .setPaddingLeft(8)
                    .setPaddingRight(8);

            value.add(new Paragraph(safe(ligne[1]))
                    .setFont(fontNormal)
                    .setFontSize(9.2f)
                    .setFontColor(GRIS_TEXTE)
                    .setMargin(0));

            table.addCell(label);
            table.addCell(value);
        }

        Cell holder = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(0);

        holder.add(table);
        wrapper.addCell(holder);

        return wrapper;
    }

    private Table creerBlocMontant(Double prix, PdfFont fontBold, PdfFont fontNormal) {
        Table montant = new Table(UnitValue.createPercentArray(new float[]{0.8f, 1.2f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(ORANGE_CLAIR)
                .setBorder(new SolidBorder(new DeviceRgb(248, 211, 180), 1))
                .setBorderRadius(new BorderRadius(10))
                .setMarginTop(2)
                .setMarginBottom(10);

        Cell left = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(12);

        left.add(new Paragraph("MONTANT TOTAL")
                .setFont(fontBold)
                .setFontSize(11)
                .setFontColor(GRIS_TEXTE)
                .setMarginBottom(2));

        left.add(new Paragraph("Prix convenu")
                .setFont(fontNormal)
                .setFontSize(8.5f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMargin(0));

        Cell right = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(12)
                .setTextAlignment(TextAlignment.RIGHT)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        right.add(new Paragraph(String.format("%.2f DT", prix))
                .setFont(fontBold)
                .setFontSize(18)
                .setFontColor(ORANGE_PRINCIPAL)
                .setMargin(0));

        montant.addCell(left);
        montant.addCell(right);

        return montant;
    }

    private Table creerBlocAcheteurVendeur(
            Utilisateur acheteur,
            MeubleResponseDTO meuble,
            PdfFont fontBold,
            PdfFont fontNormal
    ) {
        Table global = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(10);

        Cell acheteurCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingRight(6);

        acheteurCell.add(creerCartePartie(
                "ACHETEUR",
                acheteur.getPrenom() + " " + acheteur.getNom(),
                acheteur.getEmail(),
                acheteur.getTelephone(),
                VERT_PRINCIPAL,
                fontBold,
                fontNormal
        ));

        Cell vendeurCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingLeft(6);

        vendeurCell.add(creerCartePartie(
                "VENDEUR",
                meuble.getVendeurPrenom() + " " + meuble.getVendeurNom(),
                meuble.getVendeurEmail(),
                meuble.getVendeurTelephone(),
                ORANGE_PRINCIPAL,
                fontBold,
                fontNormal
        ));

        global.addCell(acheteurCell);
        global.addCell(vendeurCell);

        return global;
    }

    private Table creerCartePartie(
            String titre,
            String nom,
            String email,
            String telephone,
            DeviceRgb couleurTitre,
            PdfFont fontBold,
            PdfFont fontNormal
    ) {
        Table card = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(new SolidBorder(GRIS_BORDER, 1))
                .setBorderRadius(new BorderRadius(10))
                .setBackgroundColor(BLANC_CASSE);

        Cell title = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(10)
                .setPaddingLeft(12)
                .setPaddingRight(12)
                .setPaddingBottom(5);

        title.add(new Paragraph(titre)
                .setFont(fontBold)
                .setFontSize(11)
                .setFontColor(couleurTitre)
                .setMargin(0));

        card.addCell(title);

        Table inner = new Table(UnitValue.createPercentArray(new float[]{0.34f, 0.66f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginLeft(12)
                .setMarginRight(12)
                .setMarginBottom(12);

        ajouterLigne(inner, "Nom", safe(nom), fontBold, fontNormal);
        ajouterLigne(inner, "Email", safe(email), fontBold, fontNormal);
        ajouterLigne(inner, "Téléphone", safe(telephone), fontBold, fontNormal);

        Cell holder = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(0);

        holder.add(inner);
        card.addCell(holder);

        return card;
    }

    private Table creerBlocTransporteur(
            Utilisateur transporteur,
            PdfFont fontBold,
            PdfFont fontNormal
    ) {
        Table global = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(10);

        Cell cell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(0);

        cell.add(creerCartePartie(
                "TRANSPORTEUR",
                transporteur.getPrenom() + " " + transporteur.getNom(),
                transporteur.getEmail(),
                transporteur.getTelephone(),
                new DeviceRgb(52, 104, 214),
                fontBold,
                fontNormal
        ));

        global.addCell(cell);
        return global;
    }

    private void ajouterBlocSignature(
            Document document,
            PdfFont fontBold,
            PdfFont fontNormal,
            PdfFont fontOblique,
            String numeroRecu,
            String hash,
            String urlVerif
    ) {
        Table signatureCard = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(new DeviceRgb(249, 253, 250))
                .setBorder(new SolidBorder(new DeviceRgb(166, 214, 179), 1))
                .setBorderRadius(new BorderRadius(10))
                .setMarginTop(4)
                .setMarginBottom(8);

        Cell title = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(10)
                .setPaddingLeft(12)
                .setPaddingRight(12)
                .setPaddingBottom(5);

        title.add(new Paragraph("SIGNATURE NUMÉRIQUE")
                .setFont(fontBold)
                .setFontSize(11)
                .setFontColor(VERT_PRINCIPAL)
                .setMarginBottom(2));

        title.add(new Paragraph("Document signé numériquement par Locavia.")
                .setFont(fontNormal)
                .setFontSize(8.5f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMargin(0));

        signatureCard.addCell(title);

        Table zone = new Table(UnitValue.createPercentArray(new float[]{1.2f, 0.75f, 1.15f, 0.65f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginLeft(12)
                .setMarginRight(12)
                .setMarginBottom(12);

        Cell c1 = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(6);

        c1.add(new Paragraph(
                "Ce document est signé numériquement et son\n" +
                        "authenticité peut être vérifiée à tout moment en\n" +
                        "scannant le QR Code ou en utilisant le code de\n" +
                        "vérification sur notre plateforme."
        ).setFont(fontNormal).setFontSize(7.8f).setFontColor(GRIS_SECONDAIRE).setMargin(0));

        zone.addCell(c1);

        Cell c2 = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(6)
                .setTextAlignment(TextAlignment.CENTER)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        try {
            byte[] qrBytes = genererQrCode(urlVerif, 110);
            Image qrImage = new Image(ImageDataFactory.create(qrBytes));
            qrImage.setWidth(82);
            qrImage.setHeight(82);
            c2.add(qrImage);
        } catch (Exception e) {
            c2.add(new Paragraph("QR")
                    .setFont(fontNormal)
                    .setFontSize(8));
        }

        zone.addCell(c2);

        Cell c3 = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(6);

        c3.add(new Paragraph("CODE UNIQUE")
                .setFont(fontBold)
                .setFontSize(7.5f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMarginBottom(2));

        c3.add(new Paragraph(numeroRecu)
                .setFont(fontBold)
                .setFontSize(9.5f)
                .setFontColor(VERT_PRINCIPAL)
                .setMarginBottom(6));

        c3.add(new Paragraph("HASH SHA-256")
                .setFont(fontBold)
                .setFontSize(7.5f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMarginBottom(2));

        c3.add(new Paragraph(hash.substring(0, 32) + "\n" + hash.substring(32))
                .setFont(fontNormal)
                .setFontSize(6.1f)
                .setFontColor(GRIS_TEXTE)
                .setMarginBottom(6));

        c3.add(new Paragraph("VÉRIFIER CE DOCUMENT")
                .setFont(fontBold)
                .setFontSize(7.5f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMarginBottom(2));

        c3.add(new Paragraph(urlVerif)
                .setFont(fontNormal)
                .setFontSize(6.6f)
                .setFontColor(new DeviceRgb(52, 104, 214))
                .setMargin(0));

        zone.addCell(c3);

        Cell c4 = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(4)
                .setTextAlignment(TextAlignment.CENTER)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);

        c4.add(creerTampon(fontBold, fontOblique));
        zone.addCell(c4);

        Cell holder = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(0);

        holder.add(zone);
        signatureCard.addCell(holder);

        document.add(signatureCard);
    }

    private Table creerTampon(PdfFont fontBold, PdfFont fontOblique) {
        try {
            byte[] fontBytes = new ClassPathResource("fonts/Jalliya.ttf").getInputStream().readAllBytes();
            PdfFont fontCursive = PdfFontFactory.createFont(
                    fontBytes,
                    PdfEncodings.IDENTITY_H,
                    PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED
            );
            return construireTampon(fontBold, fontCursive);
        } catch (Exception e) {
            return construireTampon(fontBold, fontOblique);
        }
    }

    private Table construireTampon(PdfFont fontBold, PdfFont fontSignature) {
        Table tampon = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(new SolidBorder(VERT_PRINCIPAL, 1.2f))
                .setBorderRadius(new BorderRadius(12))
                .setBackgroundColor(new DeviceRgb(255, 255, 255));

        Cell inner = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(8)
                .setPaddingBottom(8)
                .setPaddingLeft(6)
                .setPaddingRight(6)
                .setTextAlignment(TextAlignment.CENTER);

        inner.add(new Paragraph("LOCAVIA")
                .setFont(fontBold)
                .setFontSize(8)
                .setFontColor(VERT_PRINCIPAL)
                .setMarginBottom(2));

        inner.add(new Paragraph("DOCUMENT SIGNÉ")
                .setFont(fontBold)
                .setFontSize(5.2f)
                .setFontColor(VERT_PRINCIPAL)
                .setMarginBottom(0));

        inner.add(new Paragraph("NUMÉRIQUEMENT")
                .setFont(fontBold)
                .setFontSize(5.2f)
                .setFontColor(VERT_PRINCIPAL)
                .setMarginBottom(4));

        inner.add(new Paragraph("Locavia")
                .setFont(fontSignature)
                .setFontSize(14)
                .setFontColor(ORANGE_PRINCIPAL)
                .setMargin(0));

        tampon.addCell(inner);
        return tampon;
    }

    private void ajouterFooter(Document document, PdfFont fontNormal, PdfFont fontOblique) {
        Table divider = new Table(UnitValue.createPercentArray(new float[]{1, 0.10f, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(3)
                .setMarginBottom(6);

        divider.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setHeight(1.5f)
                .setBackgroundColor(new DeviceRgb(180, 190, 210)));

        divider.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.CENTER)
                .add(new Paragraph("🛡")
                        .setFont(fontNormal)
                        .setFontSize(10)
                        .setFontColor(GRIS_SECONDAIRE)
                        .setMargin(0)));

        divider.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setHeight(1.5f)
                .setBackgroundColor(new DeviceRgb(180, 190, 210)));

        document.add(divider);

        document.add(new Paragraph("Conformément à la loi, ce document a la même valeur juridique qu’un reçu papier.")
                .setFont(fontOblique)
                .setFontSize(7.8f)
                .setFontColor(GRIS_SECONDAIRE)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(8));

        Table footer = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(VERT_FONCE);

        Cell left = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(8)
                .setTextAlignment(TextAlignment.LEFT);

        left.add(new Paragraph("Locavia — Plateforme sécurisée de location et colocation entre particuliers.")
                .setFont(fontNormal)
                .setFontSize(7.8f)
                .setFontColor(new DeviceRgb(255, 255, 255))
                .setMargin(0));

        Cell right = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT);

        right.add(new Paragraph("Merci pour votre confiance.")
                .setFont(fontOblique)
                .setFontSize(7.8f)
                .setFontColor(new DeviceRgb(255, 255, 255))
                .setMargin(0));

        footer.addCell(left);
        footer.addCell(right);

        document.add(footer);
    }

    private byte[] genererQrCode(String contenu, int taille) throws Exception {
        Map<EncodeHintType, Object> hints = Map.of(
                EncodeHintType.CHARACTER_SET, "UTF-8",
                EncodeHintType.MARGIN, 1
        );

        BitMatrix matrix = new MultiFormatWriter().encode(
                contenu,
                BarcodeFormat.QR_CODE,
                taille,
                taille,
                hints
        );

        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }

    private String genererHash(String contenu) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(contenu.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private void ajouterLigne(
            Table table,
            String label,
            String valeur,
            PdfFont fontBold,
            PdfFont fontNormal
    ) {
        Cell labelCell = new Cell()
                .setBackgroundColor(GRIS_BG)
                .setBorder(new SolidBorder(GRIS_BORDER, 1))
                .setPadding(6);

        labelCell.add(new Paragraph(label)
                .setFont(fontBold)
                .setFontSize(7.8f)
                .setFontColor(GRIS_SECONDAIRE)
                .setMargin(0));

        Cell valeurCell = new Cell()
                .setBorder(new SolidBorder(GRIS_BORDER, 1))
                .setPadding(6);

        valeurCell.add(new Paragraph(safe(valeur))
                .setFont(fontNormal)
                .setFontSize(8.8f)
                .setFontColor(GRIS_TEXTE)
                .setMargin(0));

        table.addCell(labelCell);
        table.addCell(valeurCell);
    }

    private String formaterEtat(MeubleResponseDTO meuble) {
        if (meuble.getEtat() == null) return "-";
        return switch (meuble.getEtat().name()) {
            case "NEUF" -> "Neuf";
            case "BON_ETAT" -> "Bon état";
            default -> "Usagé";
        };
    }

    private String safe(String value) {
        return value != null && !value.isBlank() ? value : "-";
    }

    private Image chargerLogoLocavia() {
        try {
            InputStream is = Thread.currentThread()
                    .getContextClassLoader()
                    .getResourceAsStream("logo-locavia.png");

            if (is == null) {
                System.out.println("❌ Logo introuvable : logo-locavia.png");
                return null;
            }

            byte[] logoBytes = is.readAllBytes();
            Image logo = new Image(ImageDataFactory.create(logoBytes));

            // Ajuste la taille ici
            logo.setWidth(180);
            logo.setAutoScaleHeight(true);

            System.out.println("✅ Logo chargé avec succès");
            return logo;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}