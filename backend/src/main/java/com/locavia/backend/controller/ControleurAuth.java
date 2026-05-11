package com.locavia.backend.controller;


import com.locavia.backend.dto.*;
import com.locavia.backend.service.ServiceAuth;
import com.locavia.backend.service.ServiceGoogle;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ControleurAuth {

    private final ServiceAuth   serviceAuth;
    private final ServiceGoogle serviceGoogle;

    @PostMapping("/inscription")
    public ResponseEntity<Map<String, String>> inscrire(
            @Valid @RequestBody DemandeInscription demande) {
        serviceAuth.inscrire(demande);
        return ResponseEntity.ok(Map.of(
                "message",
                "Inscription réussie. Un code OTP a été envoyé pour activer votre compte."
        ));
    }

    // ✅ Vérification OTP
    @PostMapping("/verifier-otp")
    public ResponseEntity<Map<String, String>> verifierOtp(
            @RequestBody Map<String, String> body) {
        serviceAuth.verifierOtp(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(Map.of(
                "message",
                "Compte vérifié ! En attente de validation par l'administrateur."
        ));
    }

    // ✅ Renvoyer OTP
    @PostMapping("/renvoyer-otp")
    public ResponseEntity<Map<String, String>> renvoyerOtp(
            @RequestBody Map<String, String> body) {
        serviceAuth.renvoyerOtp(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Nouveau code envoyé."));
    }

    // ✅ Connexion avec IP + User-Agent
    @PostMapping("/connexion")
    public ResponseEntity<ReponseAuth> connecter(
            @Valid @RequestBody DemandeConnexion demande,
            HttpServletRequest request) {

        String ip        = obtenirIp(request);
        String userAgent = request.getHeader("User-Agent");

        return ResponseEntity.ok(
                serviceAuth.connecter(demande, ip, userAgent)
        );
    }


    @PostMapping("/oublier-mdp")
    public ResponseEntity<Map<String, String>> oublierMdp(
            @Valid @RequestBody DemandeOublierMdp demande) {
        serviceAuth.oublierMotDePasse(demande);
        return ResponseEntity.ok(Map.of(
                "message",
                "Si cet email existe, un lien de réinitialisation a été envoyé."
        ));
    }

    @PostMapping("/reinitialiser-mdp")
    public ResponseEntity<Map<String, String>> reinitialiserMdp(
            @Valid @RequestBody DemandeReinitMdp demande) {
        serviceAuth.reinitialiserMotDePasse(demande);
        return ResponseEntity.ok(Map.of(
                "message", "Mot de passe réinitialisé avec succès."
        ));
    }

    @PostMapping("/google")
    public ResponseEntity<ReponseAuth> google(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                serviceGoogle.authentifier(body.get("idToken"))
        );
    }

    @GetMapping("/profil")
    public ResponseEntity<UtilisateurDTO> obtenirProfil(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                serviceAuth.obtenirProfil(userDetails.getUsername())
        );
    }

    @PutMapping("/profil")
    public ResponseEntity<UtilisateurDTO> mettreAJourProfil(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UtilisateurDTO dto) {
        return ResponseEntity.ok(
                serviceAuth.mettreAJourProfil(userDetails.getUsername(), dto)
        );
    }

    // ── Helper IP ────────────────────────────────────────
    private String obtenirIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        // Prendre la première IP si plusieurs
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    // ✅ Endpoint pour vérifier si le token est encore valide
    @GetMapping("/verifier-token")
    public ResponseEntity<UtilisateurDTO> verifierToken(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                serviceAuth.obtenirProfil(userDetails.getUsername())
        );
    }
}
