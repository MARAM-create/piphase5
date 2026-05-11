package com.locavia.backend.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import com.locavia.backend.dto.ContratLocationRequestDTO;
import com.locavia.backend.dto.ContratLocationResponseDTO;
import com.locavia.backend.enums.StatutContrat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface IContratLocationService {

    ContratLocationResponseDTO createContrat(ContratLocationRequestDTO dto);

    ContratLocationResponseDTO genererContratDepuisDemande(Long demandeId);

    ContratLocationResponseDTO getContratById(Long id);

    List<ContratLocationResponseDTO> getAllContrats();

    ContratLocationResponseDTO updateContratStatus(Long id, StatutContrat newStatus);

    void deleteContrat(Long id);

    ContratLocationResponseDTO genererDocumentPdf(Long contratId);

    Resource downloadPdf(Long contratId);

    ContratLocationResponseDTO uploadScannedDocument(Long contratId, MultipartFile file);

    ContratLocationResponseDTO uploadSignedDocument(Long contratId, MultipartFile file);

    List<ContratLocationResponseDTO> filterContratsByTypeAndSearch(String type, String searchTerm, LocalDate searchDate);

    /**
     * Retourne la liste des dates de paiement projetées
     * pour la durée du contrat (dateDebut → dateFin, un paiement par mois).
     */
    List<LocalDate> getCalendrierPaiements(Long contratId);

    /** Contrats actifs d'un bailleur donné. */
    List<ContratLocationResponseDTO> getContratsActifsParBailleur(Long bailleurId);

    /** Somme des paiements VALIDE pour un contrat. */
    BigDecimal getTotalPayeParContrat(Long contratId);
}

