package com.locavia.backend.controller;

import com.locavia.backend.service.PhotoService;
import com.locavia.backend.service.ServiceFaceDetection;
import com.locavia.backend.service.ServiceFaceDetection.FaceDetectionResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService          photoService;
    private final ServiceFaceDetection  faceDetection;

    @DeleteMapping("/photo")
    public ResponseEntity<Map<String, String>> supprimerPhoto(
            @AuthenticationPrincipal UserDetails userDetails) {

        photoService.supprimerPhoto(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Photo supprimée avec succès"));
    }

    @PostMapping("/photo")
    public ResponseEntity<Map<String, String>> uploaderPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("photo") MultipartFile fichier) {

        // ── Face detection gate ──────────────────────────────────────────────
        FaceDetectionResult result = faceDetection.analyzePhoto(fichier);

        if (!result.accepted()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("erreur", result.rejectionReason()));
        }

        // ── Save only if a real face was detected ────────────────────────────
        String urlPhoto = photoService.sauvegarderPhoto(
                userDetails.getUsername(), fichier);

        return ResponseEntity.ok(Map.of(
                "urlPhoto", urlPhoto,
                "message",  "Photo mise à jour avec succès"
        ));
    }
}
