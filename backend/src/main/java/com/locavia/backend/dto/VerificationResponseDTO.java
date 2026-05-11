package com.locavia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO retourné par le service de vérification IA de conformité du contrat.
 *
 * <p>Structuré pour correspondre exactement au JSON que Gemini génère, plus
 * des métadonnées utiles pour le frontend (id du contrat, modèle utilisé, etc.).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationResponseDTO {

    // ── Résultat IA ───────────────────────────────────────────────────────────

    /**
     * {@code true} si le contrat contient le tampon ET les deux signatures.
     * {@code false} si au moins un élément est absent → paiement bloqué.
     */
    private boolean isCompliant;

    /**
     * Liste des éléments visuels manquants détectés.
     * Exemples : {@code "TAMPON_OFFICIEL"}, {@code "SIGNATURE_PROPRIETAIRE"}, {@code "SIGNATURE_LOCATAIRE"}.
     * Vide si le contrat est conforme.
     */
    private List<String> missingElements;

    /**
     * Liste des éléments visuels détectés avec succès.
     * Exemples : {@code "TAMPON_OFFICIEL"}, {@code "SIGNATURE_PROPRIETAIRE"}.
     */
    private List<String> detectedElements;

    /**
     * Score de confiance de l'analyse IA, de {@code 0.0} (aucune confiance)
     * à {@code 1.0} (certitude totale).
     */
    private double confidenceScore;

    // ── Contexte ─────────────────────────────────────────────────────────────

    /** Identifiant du contrat analysé. */
    private Long contratId;

    /** Modèle Gemini utilisé pour l'analyse (ex : "gemini-1.5-flash"). */
    private String modelUsed;

    /** Message lisible expliquant le résultat (généré par Gemini ou construit localement). */
    private String analysisMessage;
}

