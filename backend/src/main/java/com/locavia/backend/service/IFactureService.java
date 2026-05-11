package com.locavia.backend.service;

import com.locavia.backend.entity.TransactionPaiement;

/**
 * Service de génération de factures PDF.
 * Utilise iText pour produire un document PDF professionnel
 * contenant les détails de la transaction de paiement.
 */
public interface IFactureService {

    /**
     * Génère une facture PDF pour une transaction de paiement validée.
     *
     * @param transaction la transaction de paiement
     * @return le contenu du PDF sous forme de byte array
     */
    byte[] genererFacturePdf(TransactionPaiement transaction);
}

