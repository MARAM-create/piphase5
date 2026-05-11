package com.locavia.backend.controller;

import com.locavia.backend.dto.ReponseMatchColocataireDTO;
import com.locavia.backend.dto.RequeteQuestionnaireDTO;
import com.locavia.backend.service.ServiceMatchingColocataires;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class ControleurMatching {

    private final ServiceMatchingColocataires matchingService;

    /** Save questionnaire + generate Jina AI embedding. */
    @PostMapping("/questionnaire")
    public ResponseEntity<Map<String, Object>> sauvegarderQuestionnaire(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RequeteQuestionnaireDTO dto) {

        matchingService.sauvegarderQuestionnaire(userDetails.getUsername(), dto);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profil enregistré. Notre IA a analysé votre personnalité !"
        ));
    }

    /** Return matches sorted by compatibility score. */
    @GetMapping("/trouver")
    public ResponseEntity<Map<String, Object>> trouverMatches(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit) {

        List<ReponseMatchColocataireDTO> matches =
                matchingService.trouverMatches(userDetails.getUsername(), limit);

        return ResponseEntity.ok(Map.of(
                "matches", matches,
                "total",   matches.size(),
                "message", matches.isEmpty()
                        ? "Aucun match trouvé. Votre profil est enregistré — d'autres étudiants pourront vous trouver."
                        : matches.size() + " colocataire(s) compatible(s) trouvé(s) par IA !"
        ));
    }

    /** Send an email message to a matched colocataire. */
    @PostMapping("/contacter/{destinataireId}")
    public ResponseEntity<Map<String, Object>> contacter(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long destinataireId,
            @RequestBody Map<String, String> body) {

        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false, "message", "Le message ne peut pas être vide."));
        }

        matchingService.contacterColocataire(userDetails.getUsername(), destinataireId, message);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message",  "Votre message a été envoyé par email !"
        ));
    }

    /** Check whether the current user has a complete profile. */
    @GetMapping("/statut")
    public ResponseEntity<Map<String, Object>> verifierStatut(
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean complet   = matchingService.questionnaireEstComplet(userDetails.getUsername());
        int     nbMatches = matchingService.compterMatchesDisponibles(userDetails.getUsername());

        return ResponseEntity.ok(Map.of(
                "questionnaireComplete",      complet,
                "nombreMatchesDisponibles",   nbMatches
        ));
    }
}
