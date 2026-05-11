package com.locavia.backend.controller;
import com.locavia.backend.entity.ProfilEtudiant;
import com.locavia.backend.repository.ProfilEtudiantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profil-etudiant")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProfilEtudiantController {
    private final ProfilEtudiantRepository profilEtudiantRepository;

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<ProfilEtudiant> getByUtilisateurId(@PathVariable Long utilisateurId) {
        return profilEtudiantRepository.findByUtilisateurId(utilisateurId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
