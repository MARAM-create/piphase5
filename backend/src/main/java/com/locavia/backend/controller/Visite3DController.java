package com.locavia.backend.controller;
import com.fasterxml.jackson.databind.JsonNode;
import com.locavia.backend.service.Visite3DService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.locavia.backend.dto.EnvoyerVisite3DRequest;

import java.util.List;

@RestController
@RequestMapping("/api/visites-3d")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class Visite3DController {

    private final Visite3DService visite3DService;

    @PostMapping(value = "/publier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> publier(
            @RequestPart("metadata") String metadata,
            @RequestPart(value = "files", required = false) MultipartFile[] files
    ) {
        try {
            return ResponseEntity.ok(visite3DService.publier(metadata, files));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(500)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Erreur backend visite 3D : " + e.getMessage());
        }
    }

    @GetMapping("/demande/{demandeId}")
    public ResponseEntity<JsonNode> getByDemande(@PathVariable Long demandeId) {
        return ResponseEntity.ok(visite3DService.getByDemande(demandeId));
    }

    @GetMapping("/annonce/{annonceId}")
    public ResponseEntity<?> getByAnnonce(@PathVariable Long annonceId) {
        try {
            return ResponseEntity.ok(visite3DService.getByAnnonce(annonceId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(500)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Erreur backend getByAnnonce : " + e.getMessage());
        }
    }
    @PostMapping("/envoyer")
    public ResponseEntity<?> envoyerAuxEtudiants(@RequestBody EnvoyerVisite3DRequest request) {
        return ResponseEntity.ok(visite3DService.envoyerAuxEtudiants(request));
    }

    @GetMapping("/partages/etudiant/{etudiantId}")
    public ResponseEntity<List<Long>> getDemandesPartageesEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(visite3DService.getDemandesPartageesEtudiant(etudiantId));
    }

    @GetMapping("/demande-partagee/{demandeId}")
    public ResponseEntity<JsonNode> getByDemandePartagee(@PathVariable Long demandeId) {
        return ResponseEntity.ok(visite3DService.getByDemandePartagee(demandeId));
    }

}
