package com.locavia.backend.controller;

import com.locavia.backend.dto.VisiteDTO;
import com.locavia.backend.service.VisiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/visites")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class VisiteController {

    private final VisiteService visiteService;


    @PostMapping
    public ResponseEntity<?> creerOuMettreAJour(@RequestBody VisiteDTO dto) {
        try {
            System.out.println("DTO VISITE RECU = " + dto);

            VisiteDTO visite = visiteService.creerOuMettreAJour(dto);
            return ResponseEntity.ok(visite);

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getClass().getSimpleName() + " : " + e.getMessage());
        }
    }
    @GetMapping("/demande/{demandeId}")
    public VisiteDTO getByDemande(@PathVariable Long demandeId) {
        return visiteService.getByDemande(demandeId);
    }

    @GetMapping("/proprietaire/{proprietaireId}")
    public List<VisiteDTO> getByProprietaire(@PathVariable Long proprietaireId) {
        return visiteService.getByProprietaire(proprietaireId);
    }

    @GetMapping("/etudiant/{etudiantId}")
    public List<VisiteDTO> getByEtudiant(@PathVariable Long etudiantId) {
        return visiteService.getByEtudiant(etudiantId);
    }
    @GetMapping("/{idVisite}")
    public VisiteDTO getById(@PathVariable Long idVisite) {
        return visiteService.getById(idVisite);
    }
    @PutMapping(value = "/{idVisite}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VisiteDTO> modifierVideoVisite(
            @PathVariable Long idVisite,
            @RequestParam(value = "demandeId", required = false) Long demandeId,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam("file") MultipartFile file
    ) {
        VisiteDTO dto = visiteService.modifierVideoVisite(idVisite, demandeId, message, file);
        return ResponseEntity.ok(dto);
    }

}
