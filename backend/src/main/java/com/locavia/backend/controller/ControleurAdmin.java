package com.locavia.backend.controller;


import com.locavia.backend.dto.UtilisateurDTO;
import com.locavia.backend.enums.Role;
import com.locavia.backend.service.ServiceAdmin;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ControleurAdmin {

    private final ServiceAdmin serviceAdmin;

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Long>> statistiques() {
        return ResponseEntity.ok(serviceAdmin.getStatistiques());
    }

    @GetMapping("/utilisateurs/en-attente")
    public ResponseEntity<List<UtilisateurDTO>> enAttente() {
        return ResponseEntity.ok(serviceAdmin.getUtilisateursEnAttente());
    }

    @GetMapping("/utilisateurs")
    public ResponseEntity<List<UtilisateurDTO>> tous() {
        return ResponseEntity.ok(serviceAdmin.getTousLesUtilisateurs());
    }

    @GetMapping("/utilisateurs/role/{role}")
    public ResponseEntity<List<UtilisateurDTO>> parRole(
            @PathVariable Role role) {
        return ResponseEntity.ok(serviceAdmin.getUtilisateursParRole(role));
    }

    @PatchMapping("/utilisateurs/{id}/approuver")
    public ResponseEntity<Map<String, String>> approuver(@PathVariable Long id) {
        serviceAdmin.approuverUtilisateur(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur approuvé."));
    }

    @PatchMapping("/utilisateurs/{id}/rejeter")
    public ResponseEntity<Map<String, String>> rejeter(@PathVariable Long id) {
        serviceAdmin.rejeterUtilisateur(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur rejeté."));
    }

    @PatchMapping("/utilisateurs/{id}/bannir")
    public ResponseEntity<Map<String, String>> bannir(@PathVariable Long id) {
        serviceAdmin.bannirUtilisateur(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur banni."));
    }

    @PatchMapping("/utilisateurs/{id}/debannir")
    public ResponseEntity<Map<String, String>> debannir(@PathVariable Long id) {
        serviceAdmin.debannirUtilisateur(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur débanni."));
    }

}