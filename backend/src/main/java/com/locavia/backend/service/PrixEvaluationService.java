package com.locavia.backend.service;

import com.locavia.backend.enums.TypeLogement;
import com.locavia.backend.enums.TypeMeublage;
import com.locavia.backend.entity.AnnonceLocation;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PrixEvaluationService {

    // ─── Prix de base TND/mois par type de logement ───────────────────────
    private static final Map<TypeLogement, Double> BASE_PRIX = Map.of(
            TypeLogement.APPARTEMENT,   900.0,
            TypeLogement.CHAMBRE_SEULE, 350.0,
            TypeLogement.COLOCATION,    450.0,
            TypeLogement.MAISON,       2000.0,
            TypeLogement.STUDIO,        600.0
    );

    // ─── Surface de référence par type ────────────────────────────────────
    private static final Map<TypeLogement, Double> SURFACE_REF = Map.of(
            TypeLogement.APPARTEMENT,   50.0,
            TypeLogement.CHAMBRE_SEULE, 12.0,
            TypeLogement.COLOCATION,    15.0,
            TypeLogement.MAISON,       150.0,
            TypeLogement.STUDIO,        25.0
    );

    // ─── Multiplicateurs par ville ────────────────────────────────────────
    private static final Map<String, Double> VILLE_MULT = Map.ofEntries(
            Map.entry("Tunis",      1.5),
            Map.entry("Ariana",     1.3),
            Map.entry("Ben Arous",  1.2),
            Map.entry("La Marsa",   1.7),
            Map.entry("Carthage",   1.8),
            Map.entry("Manouba",    1.0),
            Map.entry("Sfax",       1.1),
            Map.entry("Sousse",     1.2),
            Map.entry("Monastir",   1.15),
            Map.entry("Nabeul",     1.0),
            Map.entry("Hammamet",   1.25),
            Map.entry("Bizerte",    0.95),
            Map.entry("Gabes",      0.85),
            Map.entry("Gafsa",      0.75),
            Map.entry("Kairouan",   0.80),
            Map.entry("Mahdia",     0.90)
    );

    // ─── Méthode principale ───────────────────────────────────────────────
    public PrixEvaluationResult evaluerPrix(AnnonceLocation annonce) {

        double prixJuste = calculerPrixJuste(annonce);
        double prixMin   = Math.round(prixJuste * 0.90);  // -10%
        double prixMax   = Math.round(prixJuste * 1.10);  // +10%

        double prixDemande = annonce.getPrixMensuel() != null
                ? annonce.getPrixMensuel().doubleValue() : 0.0;

        double ecartPct = prixJuste > 0
                ? ((prixDemande - prixJuste) / prixJuste) * 100.0 : 0.0;

        String evaluation, message, couleur;

        if (Math.abs(ecartPct) <= 5) {
            evaluation = "BON_PRIX";
            message    = "✅ Ce prix correspond bien au marché tunisien.";
            couleur    = "green";
        } else if (ecartPct <= 15) {
            evaluation = "LEGEREMENT_SURVALUE";
            message    = "⚠️ Prix légèrement au-dessus du marché. Fourchette suggérée : "
                    + (int) prixMin + " – " + (int) prixMax + " TND";
            couleur    = "orange";
        } else {
            evaluation = "TROP_CHER";
            message    = "🔴 Prix trop élevé. Fourchette suggérée : "
                    + (int) prixMin + " – " + (int) prixMax + " TND";
            couleur    = "red";
        }

        return new PrixEvaluationResult(
                prixJuste, prixMin, prixMax, ecartPct, evaluation, message, couleur
        );
    }

    // ─── Calcul du prix juste ─────────────────────────────────────────────
    private double calculerPrixJuste(AnnonceLocation annonce) {

        TypeLogement type = annonce.getTypeLogement();

        double base       = BASE_PRIX.getOrDefault(type, 700.0);
        double surfaceRef = SURFACE_REF.getOrDefault(type, 50.0);
        double multVille  = VILLE_MULT.getOrDefault(annonce.getAdresse(), 1.0);

        double multMeublage = switch (annonce.getTypeMeublage()) {
            case MEUBLE        -> 1.25;
            case SEMI_MEUBLE   -> 1.10;
            case NON_MEUBLE    -> 1.00;
        };

        double surface = annonce.getSurface() != null
                ? annonce.getSurface().doubleValue() : surfaceRef;

        double corrSurface = Math.pow(surface / surfaceRef, 0.4);

        return base * multVille * multMeublage * corrSurface;
    }

    // ─── DTO résultat (record interne) ────────────────────────────────────
    public record PrixEvaluationResult(
            double prixJusteEstime,
            double prixMin,          // ← NOUVEAU
            double prixMax,          // ← NOUVEAU
            double ecartPourcentage,
            String evaluation,
            String message,
            String couleur
    ) {}
}