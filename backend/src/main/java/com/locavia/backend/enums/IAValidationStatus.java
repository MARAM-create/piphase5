package com.locavia.backend.enums;

/**
 * Statut de validation IA pour le contrat signé et scanné.
 * 
 * - PENDING: Le document a été uploadé mais pas encore validé par l'IA.
 * - VALIDATED: Le document a été accepté par l'IA (signatures et tampon confirmés).
 * - REJECTED: Le document a été rejeté par l'IA (invalide, signatures manquantes, etc.).
 */
public enum IAValidationStatus {
    PENDING,
    VALIDATED,
    REJECTED
}
