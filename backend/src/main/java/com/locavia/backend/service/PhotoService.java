package com.locavia.backend.service;

import com.locavia.backend.exception.ExceptionMetier;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final UtilisateurRepository utilisateurRepository;

    @Value("${application.upload-dir:uploads/photos}")
    private String uploadDir;

    @Value("${application.url-backend:http://localhost:8080}")
    private String urlBackend;

    private static final long MAX_SIZE  = 5 * 1024 * 1024; // 5MB
    private static final List<String> TYPES_AUTORISES =
            List.of("image/jpeg", "image/png", "image/webp");

    public String sauvegarderPhoto(String email, MultipartFile fichier) {

        // Validation taille
        if (fichier.getSize() > MAX_SIZE) {
            throw new ExceptionMetier(
                    "La photo ne doit pas dépasser 5MB");
        }

        // Validation type
        String contentType = fichier.getContentType();
        if (contentType == null || !TYPES_AUTORISES.contains(contentType)) {
            throw new ExceptionMetier(
                    "Format non supporté. Utilisez JPG, PNG ou WebP");
        }

        try {
            // Créer le dossier si nécessaire
            Path dossier = Paths.get(uploadDir);
            Files.createDirectories(dossier);

            // Générer nom unique
            String extension = obtenirExtension(fichier.getOriginalFilename());
            String nomFichier = UUID.randomUUID() + "." + extension;
            Path chemin = dossier.resolve(nomFichier);

            // Sauvegarder
            Files.copy(fichier.getInputStream(), chemin,
                    StandardCopyOption.REPLACE_EXISTING);

            // URL publique
            String urlPhoto = urlBackend + "/photos/" + nomFichier;

            // Mettre à jour en base
            utilisateurRepository.findByEmail(email).ifPresent(u -> {
                // Supprimer ancienne photo
                if (u.getPhotoProfil() != null) {
                    supprimerAnciennePhoto(u.getPhotoProfil());
                }
                u.setPhotoProfil(urlPhoto);
                utilisateurRepository.save(u);
            });

            return urlPhoto;

        } catch (IOException e) {
            throw new ExceptionMetier("Erreur lors de la sauvegarde: "
                    + e.getMessage());
        }
    }

    public void supprimerPhoto(String email) {
        utilisateurRepository.findByEmail(email).ifPresent(u -> {
            if (u.getPhotoProfil() != null) {
                supprimerAnciennePhoto(u.getPhotoProfil());
                u.setPhotoProfil(null);
                utilisateurRepository.save(u);
            }
        });
    }

    private void supprimerAnciennePhoto(String urlAncienne) {
        try {
            if (urlAncienne.contains("/photos/")) {
                String nomFichier = urlAncienne.substring(
                        urlAncienne.lastIndexOf("/photos/") + 8);
                Path chemin = Paths.get(uploadDir, nomFichier);
                Files.deleteIfExists(chemin);
            }
        } catch (IOException ignored) {}
    }

    private String obtenirExtension(String nomFichier) {
        if (nomFichier == null || !nomFichier.contains(".")) return "jpg";
        return nomFichier.substring(nomFichier.lastIndexOf(".") + 1)
                .toLowerCase();
    }
}