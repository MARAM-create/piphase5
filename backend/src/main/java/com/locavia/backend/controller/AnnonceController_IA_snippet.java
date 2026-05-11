package com.locavia.backend.controller;

import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.repository.AnnonceLocationRepository;
import com.locavia.backend.service.PrixEvaluationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/annonces")
@CrossOrigin(origins = "http://localhost:4200")
public class AnnonceController_IA_snippet {
    @Autowired
    private AnnonceLocationRepository annonceRepository;
    @Autowired
    private PrixEvaluationService prixEvaluationService;

    // ... tes autres endpoints ...

    /**
     * POST /api/annonces/{id}/evaluer-prix
     * Évalue si le prix d'une annonce est bon ou non.
     */
    @GetMapping("/{id}/evaluer-prix")
    public ResponseEntity<PrixEvaluationService.PrixEvaluationResult> evaluerPrix(
            @PathVariable Long id) {
        AnnonceLocation annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Annonce non trouvée"));

        PrixEvaluationService.PrixEvaluationResult result =
                prixEvaluationService.evaluerPrix(annonce);

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/annonces/evaluer-prix-direct
     * Évalue un prix sans ID (utile pour le formulaire de création).
     */
    @PostMapping("/evaluer-prix-direct")
    public ResponseEntity<PrixEvaluationService.PrixEvaluationResult> evaluerPrixDirect(
            @RequestBody AnnonceLocation annonce) {
        return ResponseEntity.ok(prixEvaluationService.evaluerPrix(annonce));
    }
}
