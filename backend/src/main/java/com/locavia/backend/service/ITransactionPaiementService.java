package com.locavia.backend.service;

import com.locavia.backend.dto.TransactionResponseDTO;

import java.util.List;

public interface ITransactionPaiementService {

    java.util.Map<String, String> initierPaiement(Long contratId);

    TransactionResponseDTO getPaiementById(Long id);

    List<TransactionResponseDTO> getAllPaiements();

    List<TransactionResponseDTO> getPaiementsByContratId(Long contratId);

    List<TransactionResponseDTO> getPaiementsByCurrentUser();

    String validerPaiement(String sessionId);

    byte[] genererRecuPdf(Long id);
}

