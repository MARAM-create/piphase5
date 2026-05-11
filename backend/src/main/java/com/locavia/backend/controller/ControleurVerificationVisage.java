package com.locavia.backend.controller;

import com.locavia.backend.service.ServiceFaceDetection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
@Slf4j
public class ControleurVerificationVisage {

    private final ServiceFaceDetection faceDetectionService;

    /**
     * POST /api/verification/visage
     * Vérifie si une photo contient un visage humain
     */
    @PostMapping("/visage")
    public ResponseEntity<?> verifierVisage(
            @RequestParam("photo") MultipartFile photo) {
        
        try {
            log.info("📸 [API] Face verification request received: {}", photo.getOriginalFilename());
            
            // Vérifier que le fichier n'est pas vide
            if (photo.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("erreur", "Aucune photo envoyée")
                );
            }
            
            // Vérifier le type de fichier
            String contentType = photo.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(
                    Map.of("erreur", "Le fichier doit être une image (JPG, PNG, WebP)")
                );
            }
            
            // Vérifier la taille (max 5MB)
            if (photo.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(
                    Map.of("erreur", "La photo ne doit pas dépasser 5MB")
                );
            }
            
            // Détecter le visage
            boolean visageDetecte = faceDetectionService.detectFace(photo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("visageDetecte", visageDetecte);
            response.put("message", visageDetecte ? 
                "Visage humain détecté" : 
                "Aucun visage humain détecté. Veuillez uploader une photo de vous-même."
            );
            
            log.info("✅ [API] Face verification result: {}", visageDetecte);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [API] Face verification error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                Map.of("erreur", "Erreur lors de la vérification: " + e.getMessage())
            );
        }
    }

    /**
     * GET /api/verification/health
     * Vérifie que le service de détection est opérationnel
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "statut", "OK",
            "service", "face-detection",
            "message", "Service de détection de visage opérationnel"
        ));
    }
}
