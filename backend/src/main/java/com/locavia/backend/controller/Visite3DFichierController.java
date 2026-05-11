package com.locavia.backend.controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class Visite3DFichierController {
    @Value("${app.upload.visite3d-dir}")
    private String visite3DDir;

    @GetMapping("/uploads/visites3d/{filename:.+}")
    public ResponseEntity<Resource> lireImage(@PathVariable String filename) throws Exception {
        Path path = Paths.get(visite3DDir).toAbsolutePath().normalize().resolve(filename);
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                .body(resource);
    }
}
