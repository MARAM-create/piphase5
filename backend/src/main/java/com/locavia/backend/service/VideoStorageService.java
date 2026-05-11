package com.locavia.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class VideoStorageService {

    @Value("${app.upload.video-dir}")
    private String videoDir;

    private static final Set<String> EXTENSIONS_VALIDES =
            Set.of("mp4", "mov", "avi", "webm", "mkv", "m4v");

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Fichier vidéo vide");
        }

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "" : file.getOriginalFilename()
        );

        String extension = getExtension(original).toLowerCase();

        if (!EXTENSIONS_VALIDES.contains(extension)) {
            throw new RuntimeException("Le fichier doit être une vidéo valide");
        }

        try {
            Path uploadPath = Paths.get(videoDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String fileName = UUID.randomUUID() + "." + extension;
            Path target = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // IMPORTANT : retourner l'URL du contrôleur
            return "/api/videos/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement de la vidéo", e);
        }
    }

    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot >= 0 ? filename.substring(lastDot + 1) : "";
    }
}
