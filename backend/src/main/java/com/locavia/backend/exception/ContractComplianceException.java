package com.locavia.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

/**
 * Levée quand un contrat scanné ne passe pas la vérification IA de conformité.
 * Bloque toute tentative de paiement Stripe en amont.
 *
 * <p>HTTP 400 Bad Request — le client doit corriger le document et le re-soumettre.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ContractComplianceException extends RuntimeException {

    /** Éléments visuels manquants détectés par Gemini (ex : "TAMPON", "SIGNATURE_OWNER"). */
    private final List<String> missingElements;

    /** Score de confiance retourné par Gemini (0.0 – 1.0). */
    private final double confidenceScore;

    public ContractComplianceException(List<String> missingElements, double confidenceScore) {
        super("Contrat non conforme — éléments manquants : " + missingElements);
        this.missingElements = missingElements;
        this.confidenceScore = confidenceScore;
    }

    public List<String> getMissingElements() {
        return missingElements;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }
}
