package com.locavia.backend.controller;


import com.locavia.backend.dto.ConversationResumeDTO;
import com.locavia.backend.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping("/demande/{demandeId}")
    public ResponseEntity<?> creerConversation(@PathVariable Long demandeId) {
        try {
            return ResponseEntity.ok(conversationService.creerConversation(demandeId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/demande/{demandeId}")
    public ResponseEntity<?> getConversationByDemande(@PathVariable Long demandeId) {
        try {
            return ResponseEntity.ok(conversationService.getConversationByDemande(demandeId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getConversationById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(conversationService.getConversationById(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/{etudiantId}")
    public ResponseEntity<?> getConversationsEtudiant(@PathVariable Long etudiantId) {
        try {
            System.out.println(">>> endpoint conversations étudiant appelé avec id = " + etudiantId);
            List<ConversationResumeDTO> res = conversationService.getConversationsEtudiantDTO(etudiantId);
            System.out.println(">>> nombre conversations étudiant = " + res.size());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/proprietaire/{proprietaireId}")
    public ResponseEntity<?> getConversationsProprietaire(@PathVariable Long proprietaireId) {
        try {
            System.out.println(">>> endpoint conversations propriétaire appelé avec id = " + proprietaireId);
            List<ConversationResumeDTO> res = conversationService.getConversationsProprietaireDTO(proprietaireId);
            System.out.println(">>> nombre conversations propriétaire = " + res.size());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{conversationId}/bloquer")
    public ResponseEntity<?> bloquerConversation(
            @PathVariable Long conversationId,
            @RequestParam Long utilisateurId
    ) {
        try {
            return ResponseEntity.ok(conversationService.bloquerConversation(conversationId, utilisateurId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{conversationId}/debloquer")
    public ResponseEntity<?> debloquerConversation(
            @PathVariable Long conversationId,
            @RequestParam Long utilisateurId
    ) {
        try {
            return ResponseEntity.ok(conversationService.debloquerConversation(conversationId, utilisateurId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
