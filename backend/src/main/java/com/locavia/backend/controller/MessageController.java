package com.locavia.backend.controller;
import com.locavia.backend.entity.Message;
import com.locavia.backend.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.UUID;




import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MessageController {
    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<?> envoyerMessage(@RequestBody Map<String, Object> body) {
        try {
            Long conversationId = Long.valueOf(body.get("conversationId").toString());
            Long expediteurId = Long.valueOf(body.get("expediteurId").toString());
            String contenu = body.get("contenu").toString();

            Message message = messageService.envoyerMessage(conversationId, expediteurId, contenu);

            return ResponseEntity.ok(Map.of(
                    "id", message.getId(),
                    "contenu", message.getContenu(),
                    "dateEnvoi", message.getDateEnvoi(),
                    "message", "Message envoyé avec succès"
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur interne du serveur"));
        }
    }
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getMessages(@PathVariable Long conversationId) {
        try {
            return ResponseEntity.ok(messageService.getMessagesByConversationDTO(conversationId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur interne du serveur"));
        }
    }

    @GetMapping("/conversation/{conversationId}/nonlus")
    public ResponseEntity<List<Message>> getMessagesNonLus(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getMessagesNonLus(conversationId));
    }

    @PutMapping("/conversation/{conversationId}/lus/{utilisateurId}")
    public ResponseEntity<?> marquerCommeLus(@PathVariable Long conversationId,
                                             @PathVariable Long utilisateurId) {
        messageService.marquerCommeLus(conversationId, utilisateurId);
        return ResponseEntity.ok(Map.of("message", "Messages marqués comme lus"));
    }

    @GetMapping("/nonlus/utilisateur/{utilisateurId}")
    public ResponseEntity<List<Message>> getMessagesNonLusUtilisateur(@PathVariable Long utilisateurId) {
        return ResponseEntity.ok(messageService.getMessagesNonLusUtilisateur(utilisateurId));
    }


    @GetMapping("/nonlus/count/{utilisateurId}")
    public ResponseEntity<?> countMessagesNonLusUtilisateur(@PathVariable Long utilisateurId) {
        try {
            long count = messageService.countMessagesNonLusUtilisateur(utilisateurId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur interne du serveur"));
        }
    }

    @GetMapping("/conversation/{conversationId}/nonlus/count/{utilisateurId}")
    public ResponseEntity<?> countMessagesNonLusConversation(@PathVariable Long conversationId,
                                                             @PathVariable Long utilisateurId) {
        try {
            long count = messageService.countMessagesNonLusConversation(conversationId, utilisateurId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur interne du serveur"));
        }
    }



    @PostMapping(value = "/avec-piece", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> envoyerMessageAvecPiece(
            @RequestParam Long conversationId,
            @RequestParam Long expediteurId,
            @RequestParam(required = false) String contenu,
            @RequestParam(required = false) MultipartFile fichier
    ) {
        try {
            Message message = messageService.envoyerMessageAvecPiece(
                    conversationId,
                    expediteurId,
                    contenu,
                    fichier
            );

            Map<String, Object> body = new HashMap<>();
            body.put("id", message.getId());
            body.put("contenu", message.getContenu());
            body.put("dateEnvoi", message.getDateEnvoi());
            body.put("estLu", message.getEstLu());

            body.put("pieceJointeUrl", message.getPieceJointeUrl());
            body.put("pieceJointeNom", message.getPieceJointeNom());
            body.put("pieceJointeType", message.getPieceJointeType());

            body.put("message", "Message envoyé avec succès");

            return ResponseEntity.ok(body);

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Erreur interne du serveur"));
        }
    }

    @PutMapping("/{messageId}/modifier")
    public ResponseEntity<?> modifierMessage(
            @PathVariable Long messageId,
            @RequestParam Long utilisateurId,
            @RequestParam String contenu
    ) {
        try {
            return ResponseEntity.ok(messageService.modifierMessage(messageId, utilisateurId, contenu));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> supprimerMessage(
            @PathVariable Long messageId,
            @RequestParam Long utilisateurId
    ) {
        try {
            messageService.supprimerMessage(messageId, utilisateurId);
            return ResponseEntity.ok(Map.of("message", "Message supprimé"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    @PutMapping("/{messageId}/reaction")
    public ResponseEntity<?> reagirMessage(
            @PathVariable Long messageId,
            @RequestParam String emoji
    ) {
        try {
            return ResponseEntity.ok(messageService.reagirMessage(messageId, emoji));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    @DeleteMapping("/{messageId}/reaction")
    public ResponseEntity<?> retirerReaction(
            @PathVariable Long messageId
    ) {
        try {
            return ResponseEntity.ok(messageService.retirerReaction(messageId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
