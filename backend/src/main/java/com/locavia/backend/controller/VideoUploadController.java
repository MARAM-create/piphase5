package com.locavia.backend.controller;

import com.locavia.backend.dto.VideoUploadResponse;
import com.locavia.backend.service.VideoStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class VideoUploadController {
    private final VideoStorageService videoStorageService;

    @Value("${app.upload.video-dir}")
    private String videoDir;

    @PostMapping("/upload")
    public ResponseEntity<VideoUploadResponse> uploadVideo(@RequestParam("file") MultipartFile file) {
        try {
            String url = videoStorageService.store(file);
            return ResponseEntity.ok(new VideoUploadResponse(url));
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur upload vidéo : " + e.getMessage(), e);
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> lireVideo(@PathVariable String filename) throws MalformedURLException {
        Path path = Paths.get(videoDir).toAbsolutePath().normalize().resolve(filename).normalize();
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String lower = filename.toLowerCase();

        if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) {
            mediaType = MediaType.parseMediaType("video/mp4");
        } else if (lower.endsWith(".webm")) {
            mediaType = MediaType.parseMediaType("video/webm");
        } else if (lower.endsWith(".mov")) {
            mediaType = MediaType.parseMediaType("video/quicktime");
        } else if (lower.endsWith(".avi")) {
            mediaType = MediaType.parseMediaType("video/x-msvideo");
        } else if (lower.endsWith(".mkv")) {
            mediaType = MediaType.parseMediaType("video/x-matroska");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(resource);
    }
}
