// AnnonceLocationController.java
package com.locavia.backend.controller;

import com.locavia.backend.dto.AnnonceLocationDTO;
import com.locavia.backend.service.IAnnonceLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/annonces")
public class AnnonceLocationController {

    @Autowired
    private IAnnonceLocationService annonceService;

    @GetMapping
    public ResponseEntity<List<AnnonceLocationDTO>> getAll() {
        return ResponseEntity.ok(annonceService.retrieveAllAnnonces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnonceLocationDTO> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(annonceService.retrieveAnnonce(id));
    }

    @PostMapping
    public ResponseEntity<AnnonceLocationDTO> create(
            @RequestBody AnnonceLocationDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Access-Control-Allow-Origin", "http://localhost:4200");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(annonceService.addAnnonce(dto, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnnonceLocationDTO> update(
            @PathVariable Long id,
            @RequestBody AnnonceLocationDTO dto
    ) {
        dto.setIdAnnonce(id);  // ensure id is set even if frontend forgot
        return ResponseEntity.ok(annonceService.modifyAnnonce(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        annonceService.removeAnnonce(id);
        return ResponseEntity.noContent().build();
    }
    //added by user
    @GetMapping("/mes-annonces")
    public ResponseEntity<List<AnnonceLocationDTO>> getMesAnnonces(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(annonceService.getByProprietaire(userDetails.getUsername()));
    }
    @PatchMapping("/{id}/etat")
    public ResponseEntity<AnnonceLocationDTO> updateEtat(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String nouvelEtat = body.get("etatAnnonce");
        return ResponseEntity.ok(annonceService.updateEtat(id, nouvelEtat));
    }
}