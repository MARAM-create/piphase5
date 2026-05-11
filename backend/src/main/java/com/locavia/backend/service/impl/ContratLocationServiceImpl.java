package com.locavia.backend.service.impl;

import com.locavia.backend.dto.ContratLocationRequestDTO;
import com.locavia.backend.dto.ContratLocationResponseDTO;
import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.entity.ContratLocation;
import com.locavia.backend.entity.DemandeLocation;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.IAValidationStatus;
import com.locavia.backend.enums.StatutContrat;
import com.locavia.backend.enums.StatutIa;
import com.locavia.backend.mapper.ContratLocationMapper;
import com.locavia.backend.repository.AnnonceLocationRepository;
import com.locavia.backend.repository.ContratLocationRepository;
import com.locavia.backend.repository.DemandeLocationRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import com.locavia.backend.service.IAVerificationService;
import com.locavia.backend.service.IContratLocationService;
import com.locavia.backend.service.PdfGenerationService;
import com.locavia.backend.repository.TransactionPaiementRepository;
import com.locavia.backend.enums.StatutPaiement;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContratLocationServiceImpl implements IContratLocationService {

    private static final String SCANS_UPLOAD_DIR = "uploads/scans";

    private final ContratLocationRepository contratLocationRepository;
    private final DemandeLocationRepository demandeLocationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceLocationRepository annonceLocationRepository;
    private final ContratLocationMapper contratLocationMapper;
    private final PdfGenerationService pdfGenerationService;
    private final IAVerificationService iaVerificationService;
    private final TransactionPaiementRepository transactionPaiementRepository;

    @Override
    public ContratLocationResponseDTO createContrat(ContratLocationRequestDTO dto) {
        DemandeLocation demande = demandeLocationRepository.findById(dto.getDemandeId())
                .orElseThrow(() -> new EntityNotFoundException("DemandeLocation introuvable avec l'id : " + dto.getDemandeId()));

        Utilisateur locataire = utilisateurRepository.findById(dto.getLocataireId())
                .orElseThrow(() -> new EntityNotFoundException("Locataire introuvable avec l'id : " + dto.getLocataireId()));

        Utilisateur bailleur = utilisateurRepository.findById(dto.getBailleurId())
                .orElseThrow(() -> new EntityNotFoundException("Bailleur introuvable avec l'id : " + dto.getBailleurId()));

        AnnonceLocation annonce = annonceLocationRepository.findById(dto.getAnnonceId())
                .orElseThrow(() -> new EntityNotFoundException("AnnonceLocation introuvable avec l'id : " + dto.getAnnonceId()));

        ContratLocation contrat = ContratLocation.builder()
                .demande(demande)
                .locataire(locataire)
                .bailleur(bailleur)
                .annonce(annonce)
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .statutIa(StatutIa.EN_ATTENTE)
                .statutContrat(StatutContrat.BROUILLON)
                .iaValidationStatus(IAValidationStatus.PENDING)
                .build();

        ContratLocation saved = contratLocationRepository.save(contrat);
        return contratLocationMapper.toResponseDTO(saved);
    }

    @Override
    @Transactional
    public ContratLocationResponseDTO genererContratDepuisDemande(Long demandeId) {
        try {
            // ✅ Correction : Utilisation du nom de méthode synchronisé avec le Repository
            if (contratLocationRepository.existsByDemande_IdDemande(demandeId)) {
                throw new IllegalStateException("Un contrat a déjà été généré pour cette demande.");
            }

            DemandeLocation demande = demandeLocationRepository.findById(demandeId)
                    .orElseThrow(() -> new EntityNotFoundException("Demande introuvable."));

            ContratLocation contrat = new ContratLocation();
            contrat.setDemande(demande);
            contrat.setLocataire(demande.getEtudiant());
            contrat.setBailleur(demande.getAnnonce().getProprietaire());
            contrat.setAnnonce(demande.getAnnonce());
            contrat.setDateDebut(LocalDate.now());
            contrat.setDateFin(LocalDate.now().plusYears(1));
            contrat.setStatutIa(StatutIa.EN_ATTENTE);
            contrat.setStatutContrat(StatutContrat.BROUILLON);
            contrat.setIaValidationStatus(IAValidationStatus.PENDING);

            ContratLocation saved = contratLocationRepository.save(contrat);
            return contratLocationMapper.toResponseDTO(saved);
        } catch (Exception e) {
            log.error("Erreur génération contrat : {}", e.getMessage());
            throw new RuntimeException("Erreur : " + e.getMessage());
        }
    }

    @Override
    public ContratLocationResponseDTO getContratById(Long id) {
        ContratLocation contrat = contratLocationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contrat introuvable."));
        return contratLocationMapper.toResponseDTO(contrat);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratLocationResponseDTO> getAllContrats() {
        return contratLocationRepository.findAll().stream()
                .map(contratLocationMapper::toResponseDTO)
                .toList();
    }

    @Override
    public ContratLocationResponseDTO updateContratStatus(Long id, StatutContrat newStatus) {
        ContratLocation contrat = contratLocationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contrat introuvable."));
        contrat.setStatutContrat(newStatus);
        return contratLocationMapper.toResponseDTO(contratLocationRepository.save(contrat));
    }

    @Override
    public void deleteContrat(Long id) {
        if (!contratLocationRepository.existsById(id)) {
            throw new EntityNotFoundException("Contrat introuvable.");
        }
        contratLocationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public ContratLocationResponseDTO genererDocumentPdf(Long contratId) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new EntityNotFoundException("Contrat introuvable."));
        try {
            String pdfPath = pdfGenerationService.generateContratViergePdf(contrat);
            contrat.setPdfViergeUrl(pdfPath);
            return contratLocationMapper.toResponseDTO(contratLocationRepository.save(contrat));
        } catch (IOException e) {
            throw new RuntimeException("Erreur génération PDF", e);
        }
    }

    @Override
    public Resource downloadPdf(Long contratId) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new EntityNotFoundException("Contrat introuvable."));
        String pdfUrl = contrat.getPdfViergeUrl();
        if (pdfUrl == null || pdfUrl.isBlank()) throw new IllegalStateException("PDF non généré.");
        try {
            Path filePath = Paths.get(pdfUrl).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) throw new RuntimeException("Fichier introuvable.");
            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Erreur chemin PDF", e);
        }
    }

    @Override
    public ContratLocationResponseDTO uploadScannedDocument(Long contratId, MultipartFile file) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new EntityNotFoundException("Contrat introuvable."));

        if (file.isEmpty()) throw new IllegalArgumentException("Fichier vide.");

        try {
            Path uploadPath = Paths.get(SCANS_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            String fileName = "scan_contrat_" + contratId + extension;
            Path targetPath = uploadPath.resolve(fileName);

            byte[] fileBytes = file.getBytes();
            Files.copy(new ByteArrayInputStream(fileBytes), targetPath, StandardCopyOption.REPLACE_EXISTING);

            contrat.setImageScanneUrl(SCANS_UPLOAD_DIR + "/" + fileName);
            contrat.setStatutIa(StatutIa.EN_COURS_ANALYSE);
            ContratLocation saved = contratLocationRepository.save(contrat);

            return iaVerificationService.analyserDocument(saved.getId(), fileBytes);
        } catch (IOException e) {
            throw new RuntimeException("Erreur upload scan", e);
        }
    }

    @Override
    public ContratLocationResponseDTO uploadSignedDocument(Long contratId, MultipartFile file) {
        return uploadScannedDocument(contratId, file);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratLocationResponseDTO> filterContratsByTypeAndSearch(String type, String searchTerm, LocalDate searchDate) {
        List<ContratLocation> results;
        if ("SIGNED".equalsIgnoreCase(type)) {
            results = contratLocationRepository.findByImageScanneUrlIsNotNullAndIaValidationStatus(IAValidationStatus.VALIDATED);
        } else if ("ACTIVE".equalsIgnoreCase(type)) {
            results = contratLocationRepository.findByStatutContrat(StatutContrat.ACTIF);
        } else {
            results = contratLocationRepository.findAll();
        }
        
        // Filtrage en mémoire par terme de recherche
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String term = searchTerm.toLowerCase().trim();
            results = results.stream().filter(c -> {
                String locataireNom = c.getLocataire() != null ? (c.getLocataire().getPrenom() + " " + c.getLocataire().getNom()).toLowerCase() : "";
                String bailleurNom = c.getBailleur() != null ? (c.getBailleur().getPrenom() + " " + c.getBailleur().getNom()).toLowerCase() : "";
                String annonceTitre = c.getAnnonce() != null && c.getAnnonce().getTitre() != null ? c.getAnnonce().getTitre().toLowerCase() : "";
                String ref = String.valueOf(c.getId());
                return locataireNom.contains(term) || bailleurNom.contains(term) || annonceTitre.contains(term) || ref.contains(term);
            }).toList();
        }

        // Filtrage en mémoire par date
        if (searchDate != null) {
            results = results.stream().filter(c -> 
                (c.getDateDebut() != null && c.getDateDebut().equals(searchDate)) || 
                (c.getDateFin() != null && c.getDateFin().equals(searchDate))
            ).toList();
        }

        return results.stream().map(contratLocationMapper::toResponseDTO).toList();
    }

    @Override
    public List<LocalDate> getCalendrierPaiements(Long contratId) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new EntityNotFoundException("Contrat introuvable."));

        LocalDate datePaiement = contrat.getDateDebut();
        List<LocalDate> calendrier = new ArrayList<>();
        while (datePaiement != null && !datePaiement.isAfter(contrat.getDateFin())) {
            calendrier.add(datePaiement);
            datePaiement = datePaiement.plusMonths(1);
        }
        return calendrier;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContratLocationResponseDTO> getContratsActifsParBailleur(Long bailleurId) {
        return contratLocationRepository
                .findByBailleur_IdAndStatutContrat(bailleurId, StatutContrat.ACTIF)
                .stream()
                .map(contratLocationMapper::toResponseDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPayeParContrat(Long contratId) {
        BigDecimal total = transactionPaiementRepository
                .sumMontantByContratIdAndStatut(contratId, StatutPaiement.VALIDE);
        return total != null ? total : BigDecimal.ZERO;
    }
}