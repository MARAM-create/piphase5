package com.locavia.backend.controller;

import com.locavia.backend.service.IEmailService; // Utilise l'interface
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.locavia.backend.dto.TransactionResponseDTO;
import com.locavia.backend.service.ITransactionPaiementService;

import java.util.List;

@RestController
@RequestMapping("/api/paiements")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class TransactionPaiementController {

    private final ITransactionPaiementService transactionPaiementService;

    // CORRECTION 1 : On utilise l'interface injectée (minuscule)
    private final IEmailService emailService;

    @PostMapping(value = "/initier/{contratId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<java.util.Map<String, String>> initierPaiement(@PathVariable Long contratId) {
        try {
            java.util.Map<String, String> response = transactionPaiementService.initierPaiement(contratId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("erreur", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * GET version pour tester directement dans le navigateur.
     * Accédez à http://localhost:8080/api/paiements/test-initier/4
     */
    @GetMapping(value = "/test-initier/{contratId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<java.util.Map<String, String>> testInitierPaiement(@PathVariable Long contratId) {
        try {
            java.util.Map<String, String> response = transactionPaiementService.initierPaiement(contratId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("erreur", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping(value = "/success")
    public org.springframework.web.servlet.view.RedirectView paiementSuccess(@RequestParam String sessionId) {
        transactionPaiementService.validerPaiement(sessionId);
        return new org.springframework.web.servlet.view.RedirectView("http://localhost:4200/tableau-de-bord/etudiant/contrats?payment=success");
    }

    @GetMapping(value = "/cancel")
    public org.springframework.web.servlet.view.RedirectView paiementCancel() {
        return new org.springframework.web.servlet.view.RedirectView("http://localhost:4200/tableau-de-bord/etudiant/contrats");
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> getPaiementById(@PathVariable Long id) {
        TransactionResponseDTO dto = transactionPaiementService.getPaiementById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponseDTO>> getAllPaiements() {
        return ResponseEntity.ok(transactionPaiementService.getAllPaiements());
    }

    @GetMapping("/contrat/{contratId}")
    public ResponseEntity<List<TransactionResponseDTO>> getPaiementsByContratId(@PathVariable Long contratId) {
        return ResponseEntity.ok(transactionPaiementService.getPaiementsByContratId(contratId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<TransactionResponseDTO>> getMyPaiements() {
        return ResponseEntity.ok(transactionPaiementService.getPaiementsByCurrentUser());
    }

    @GetMapping(value = {"/{id}/recu", "/facture/{id}"}, produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> telechargerRecuPdf(@PathVariable Long id) {
        byte[] pdfBytes = transactionPaiementService.genererRecuPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recu_paiement_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/envoyer-notification-paiement")
    public ResponseEntity<String> envoyerNotificationPaiement(@RequestParam String destinataire) {
        // CORRECTION 2 : Appel via l'instance emailService (minuscule)
        emailService.envoyerEmail(
                destinataire,
                "Locavia — Notification de paiement",
                "Ceci est un email de notification envoyé depuis l'API Locavia.\n"
                        + "Si vous recevez ce message, la configuration email fonctionne correctement.\n\n"
                        + "Cordialement,\nL'équipe Locavia"
        );
        return ResponseEntity.ok("Notification envoyée avec succès à : " + destinataire);
    }
}