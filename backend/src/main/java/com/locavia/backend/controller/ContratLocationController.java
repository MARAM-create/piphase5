package com.locavia.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.locavia.backend.dto.ContratLocationRequestDTO;
import com.locavia.backend.dto.ContratLocationResponseDTO;
import com.locavia.backend.dto.VerificationResponseDTO;
import com.locavia.backend.enums.StatutContrat;
import com.locavia.backend.exception.ContractComplianceException;
import com.locavia.backend.exception.ServiceUnavailableException;
import com.locavia.backend.service.IAVerificationService;
import com.locavia.backend.service.IContratLocationService;
import com.locavia.backend.service.StripePaymentService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la gestion des contrats de location.
 *
 * <h2>Flux de cycle de vie IA + Paiement</h2>
 * <pre>
 *   POST /api/contrats/{id}/upload-scanned
 *          │
 *          ▼
 *   IAVerificationService.analyserDocument()
 *          │
 *          ├── ✅ VALIDE  → statutContrat = EN_ATTENTE_PAIEMENT
 *          │                → POST /api/contrats/{id}/checkout autorisé
 *          │
 *          ├── ❌ REJETE  → HTTP 400 + liste des éléments manquants
 *          │                → POST /api/contrats/{id}/checkout BLOQUÉ
 *          │
 *          └── 🌐 IA indisponible → HTTP 503 + conseils proxy/VPN
 * </pre>
 */
@RestController
@RequestMapping("/api/contrats")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
@Slf4j
public class ContratLocationController {

    private final IContratLocationService contratLocationService;
    private final IAVerificationService   iaVerificationService;
    private final StripePaymentService    stripePaymentService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ContratLocationResponseDTO> createContrat(
            @Valid @RequestBody ContratLocationRequestDTO dto) {
        ContratLocationResponseDTO created = contratLocationService.createContrat(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/generer/{demandeId}")
    public ResponseEntity<ContratLocationResponseDTO> genererContratDepuisDemande(
            @PathVariable Long demandeId) {
        ContratLocationResponseDTO response = contratLocationService.genererContratDepuisDemande(demandeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContratLocationResponseDTO> getContratById(@PathVariable Long id) {
        return ResponseEntity.ok(contratLocationService.getContratById(id));
    }

    @GetMapping
    public ResponseEntity<List<ContratLocationResponseDTO>> getAllContrats() {
        return ResponseEntity.ok(contratLocationService.getAllContrats());
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<ContratLocationResponseDTO> updateContratStatus(
            @PathVariable Long id,
            @RequestParam StatutContrat statut) {
        return ResponseEntity.ok(contratLocationService.updateContratStatus(id, statut));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContrat(@PathVariable Long id) {
        contratLocationService.deleteContrat(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ContratLocationResponseDTO>> filterContrats(
            @RequestParam String type,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate searchDate) {
        return ResponseEntity.ok(contratLocationService.filterContratsByTypeAndSearch(type, searchTerm, searchDate));
    }

    /**
     * GET /api/contrats/proprietaire/{id}/actifs
     * Retourne tous les contrats ACTIF d'un bailleur donné.
     */
    @GetMapping("/proprietaire/{bailleurId}/actifs")
    public ResponseEntity<List<ContratLocationResponseDTO>> getContratsActifsParBailleur(
            @PathVariable Long bailleurId) {
        return ResponseEntity.ok(contratLocationService.getContratsActifsParBailleur(bailleurId));
    }

    /**
     * GET /api/contrats/{id}/total-paye
     * Retourne la somme des paiements VALIDE pour un contrat.
     */
    @GetMapping("/{id}/total-paye")
    public ResponseEntity<Map<String, BigDecimal>> getTotalPaye(@PathVariable Long id) {
        BigDecimal total = contratLocationService.getTotalPayeParContrat(id);
        return ResponseEntity.ok(Map.of("totalPaye", total));
    }

    // ── PDF ───────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/generer-pdf")
    public ResponseEntity<?> genererPdf(@PathVariable Long id) {
        try {
            ContratLocationResponseDTO result = contratLocationService.genererDocumentPdf(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur lors de la génération du PDF: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        try {
            Resource resource = contratLocationService.downloadPdf(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"contrat_" + id + ".pdf\"")
                    .body(resource);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur inattendue au téléchargement: " + e.getMessage()));
        }
    }

    // ── UPLOAD & VÉRIFICATION IA ───────────────────────────────────────────────

    /**
     * Upload le document scanné (PDF, JPG ou PNG) et déclenche automatiquement la vérification IA.
     *
     * <p>Formats acceptés : {@code application/pdf}, {@code image/jpeg}, {@code image/png}.
     *
     * <p>Réponses possibles :
     * <ul>
     *   <li>{@code 200 OK} — Contrat conforme, prêt pour le paiement</li>
     *   <li>{@code 400 Bad Request} — {@link ContractComplianceException} — éléments manquants</li>
     *   <li>{@code 415 Unsupported Media Type} — format de fichier non supporté</li>
     *   <li>{@code 503 Service Unavailable} — {@link ServiceUnavailableException} — IA inaccessible</li>
     * </ul>
     */
    @PostMapping(value = "/{id}/upload-scanned", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadScanned(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        String contentType = file.getContentType();
        boolean isSupported = "application/pdf".equals(contentType)
                || "image/jpeg".equals(contentType)
                || "image/png".equals(contentType);

        if (!isSupported) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(Map.of("erreur",
                            "Format non supporté : '" + contentType + "'. "
                            + "Formats acceptés : application/pdf, image/jpeg, image/png."));
        }

        ContratLocationResponseDTO result = contratLocationService.uploadScannedDocument(id, file);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContratLocationResponseDTO> uploadSignedContract(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        ContratLocationResponseDTO result = contratLocationService.uploadSignedDocument(id, file);
        return ResponseEntity.ok(result);
    }

    /**
     * Déclenche manuellement la vérification IA sur un contrat déjà uploadé.
     * Retourne le {@link VerificationResponseDTO} complet (éléments détectés,
     * éléments manquants, score de confiance).
     *
     * <p>Utile pour relancer la vérification sans re-uploader le fichier.
     */
    @PostMapping("/{id}/valider-contrat")
    public ResponseEntity<ContratLocationResponseDTO> validerContrat(@PathVariable Long id) {
        ContratLocationResponseDTO result = iaVerificationService.analyserDocument(id);
        return ResponseEntity.ok(result);
    }

    // ── CALENDRIER DE PAIEMENTS ───────────────────────────────────────────────

    @GetMapping("/{id}/calendrier-paiements")
    public ResponseEntity<List<LocalDate>> getCalendrierPaiements(@PathVariable Long id) {
        return ResponseEntity.ok(contratLocationService.getCalendrierPaiements(id));
    }

    // ── PAIEMENT STRIPE (précédé de la vérification IA) ──────────────────────

    /**
     * Crée une session de paiement Stripe pour le contrat.
     *
     * <p><b>⚠️ Pré-condition obligatoire :</b>
     * Le contrat doit avoir été validé par l'IA ({@code iaValidationStatus = VALIDATED}).
     * Si ce n'est pas le cas, le service lève une {@link ContractComplianceException}
     * (HTTP 400) avec la liste des éléments manquants ou non validés.
     *
     * <p>Flux : {@code upload-scanned → IA valide → checkout autorisé}.
     */
    @PostMapping("/{id}/checkout")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@PathVariable Long id) {
        Map<String, String> response = stripePaymentService.createCheckoutSession(id);
        return ResponseEntity.ok(response);
    }
}

