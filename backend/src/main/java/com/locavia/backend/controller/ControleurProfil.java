package com.locavia.backend.controller;


import com.locavia.backend.dto.ProfilEtudiantDTO;
import com.locavia.backend.dto.ProfilPrestataireDTO;
import com.locavia.backend.dto.ProfilProprietaireDTO;
import com.locavia.backend.service.ServiceProfil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ControleurProfil {

    private final ServiceProfil serviceProfil;

    // ── Étudiant ─────────────────────────────────────────────
    @GetMapping("/etudiant")
    public ResponseEntity<ProfilEtudiantDTO> getEtudiant(
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(
                serviceProfil.obtenirProfilEtudiant(u.getUsername()));
    }

    @PutMapping("/etudiant")
    public ResponseEntity<ProfilEtudiantDTO> saveEtudiant(
            @AuthenticationPrincipal UserDetails u,
            @RequestBody ProfilEtudiantDTO dto) {
        return ResponseEntity.ok(
                serviceProfil.sauvegarderProfilEtudiant(u.getUsername(), dto));
    }

    // ── Propriétaire ─────────────────────────────────────────
    @GetMapping("/proprietaire")
    public ResponseEntity<ProfilProprietaireDTO> getProprietaire(
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(
                serviceProfil.obtenirProfilProprietaire(u.getUsername()));
    }

    @PutMapping("/proprietaire")
    public ResponseEntity<ProfilProprietaireDTO> saveProprietaire(
            @AuthenticationPrincipal UserDetails u,
            @RequestBody ProfilProprietaireDTO dto) {
        return ResponseEntity.ok(
                serviceProfil.sauvegarderProfilProprietaire(u.getUsername(), dto));
    }

    // ── Prestataire ──────────────────────────────────────────
    @GetMapping("/prestataire")
    public ResponseEntity<ProfilPrestataireDTO> getPrestataire(
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(
                serviceProfil.obtenirProfilPrestataire(u.getUsername()));
    }

    @PutMapping("/prestataire")
    public ResponseEntity<ProfilPrestataireDTO> savePrestataire(
            @AuthenticationPrincipal UserDetails u,
            @RequestBody ProfilPrestataireDTO dto) {
        return ResponseEntity.ok(
                serviceProfil.sauvegarderProfilPrestataire(u.getUsername(), dto));
    }
}