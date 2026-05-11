package com.locavia.backend.controller;

import com.locavia.backend.dto.DemandeServiceRequestDTO;
import com.locavia.backend.dto.DemandeServiceResponseDTO;
import com.locavia.backend.dto.DisponibiliteDTO;
import com.locavia.backend.dto.ProfilPrestataireResponseDTO;
import com.locavia.backend.service.DemandeServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DemandeServiceController {

    private final DemandeServiceService demandeService;

    @GetMapping("/prestataires")
    public ResponseEntity<List<ProfilPrestataireResponseDTO>> listerPrestataires() {
        return ResponseEntity.ok(demandeService.listerPrestataires());
    }

    @GetMapping("/mon-profil")
    public ResponseEntity<Map<String, String>> getMonProfil() {
        return ResponseEntity.ok(Map.of(
                "ville",   demandeService.getVilleUtilisateur(),
                "adresse", demandeService.getAdresseUtilisateur()
        ));
    }

    // GET disponibilités d'un prestataire
    @GetMapping("/prestataires/{id}/disponibilites")
    public ResponseEntity<List<DisponibiliteDTO>> getDisponibilites(
            @PathVariable Long id) {
        return ResponseEntity.ok(demandeService.getDisponibilites(id));
    }

    @PostMapping("/demandes")
    public ResponseEntity<DemandeServiceResponseDTO> envoyerDemande(
            @RequestBody DemandeServiceRequestDTO dto) {
        return ResponseEntity.ok(demandeService.envoyerDemande(dto));
    }

    @PutMapping("/demandes/{id}")
    public ResponseEntity<DemandeServiceResponseDTO> modifier(
            @PathVariable Long id,
            @RequestBody DemandeServiceRequestDTO dto) {
        return ResponseEntity.ok(demandeService.modifierDemande(id, dto));
    }

    @DeleteMapping("/demandes/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        demandeService.supprimerDemande(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/demandes/toutes")
    public ResponseEntity<List<DemandeServiceResponseDTO>> toutesLesDemandes() {
        return ResponseEntity.ok(demandeService.toutesLesDemandes());
    }

    @GetMapping("/demandes/mes-demandes")
    public ResponseEntity<List<DemandeServiceResponseDTO>> mesDemandes() {
        return ResponseEntity.ok(demandeService.mesDemandes());
    }

    @GetMapping("/demandes/recues")
    public ResponseEntity<List<DemandeServiceResponseDTO>> demandesRecues() {
        return ResponseEntity.ok(demandeService.demandesRecues());
    }

    @GetMapping("/demandes/{id}")
    public ResponseEntity<DemandeServiceResponseDTO> getDetail(
            @PathVariable Long id) {
        return ResponseEntity.ok(demandeService.getDetail(id));
    }

    @PostMapping("/demandes/{id}/accepter")
    public ResponseEntity<DemandeServiceResponseDTO> accepter(
            @PathVariable Long id) {
        return ResponseEntity.ok(demandeService.accepterDemande(id));
    }

    @PostMapping("/demandes/{id}/refuser")
    public ResponseEntity<DemandeServiceResponseDTO> refuser(
            @PathVariable Long id) {
        return ResponseEntity.ok(demandeService.refuserDemande(id));
    }
}