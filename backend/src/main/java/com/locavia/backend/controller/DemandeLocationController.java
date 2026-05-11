package com.locavia.backend.controller;

import com.locavia.backend.dto.DemandeLocationDTO;
import com.locavia.backend.dto.DemandeLocationRequest;
import com.locavia.backend.dto.DemandeRecueProprietaireDTO;
import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.entity.DemandeLocation;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.FormatVisiteSouhaite;
import com.locavia.backend.enums.StatutDemande;
import com.locavia.backend.enums.TypeVisiteSouhaitee;
import com.locavia.backend.repository.AnnonceLocationRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import com.locavia.backend.service.DemandeLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DemandeLocationController {

    private final DemandeLocationService demandeLocationService;
    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceLocationRepository annonceLocationRepository;

    @PostMapping
    public ResponseEntity<?> creerDemande(@RequestBody DemandeLocationRequest req) {
        try {
            Utilisateur etudiant = utilisateurRepository.findById(req.getEtudiantId())
                    .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

            AnnonceLocation annonce = annonceLocationRepository.findById(req.getAnnonceId())
                    .orElseThrow(() -> new RuntimeException("Annonce introuvable"));

            DemandeLocation demande = new DemandeLocation();
            demande.setEtudiant(etudiant);
            demande.setAnnonce(annonce);
            demande.setMessageCandidat(req.getMessageCandidat());
            demande.setNombrePersonnes(req.getNombrePersonnes());

            if (req.getDateEntree() != null && !req.getDateEntree().isBlank()) {
                demande.setDateEntree(LocalDate.parse(req.getDateEntree()));
            }

            if (req.getDateSouhaitee() != null && !req.getDateSouhaitee().isBlank()) {
                demande.setDateSouhaitee(LocalDate.parse(req.getDateSouhaitee()));
            }

            demande.setDureeLocation(req.getDureeLocation());
            demande.setBudget(req.getBudget());
            demande.setVilleActuelle(req.getVilleActuelle());
            demande.setCriterePrincipal(req.getCriterePrincipal());
            demande.setBesoinPrincipal(req.getBesoinPrincipal());
            demande.setRemarqueLogement(req.getRemarqueLogement());

            demande.setTypeVisite(
                    req.getTypeVisite() != null && !req.getTypeVisite().isBlank()
                            ? TypeVisiteSouhaitee.valueOf(req.getTypeVisite())
                            : null
            );

            if (demande.getTypeVisite() != TypeVisiteSouhaitee.SUR_PLACE) {
                demande.setFormatVisite(
                        req.getFormatVisite() != null && !req.getFormatVisite().isBlank()
                                ? FormatVisiteSouhaite.valueOf(req.getFormatVisite())
                                : null
                );
            }

            demande.setMomentVisite(req.getMomentVisite());
            demande.setJoursDisponibles(req.getJoursDisponibles());
            demande.setPlageHoraire(req.getPlageHoraire());
            demande.setRemarqueDisponibilite(req.getRemarqueDisponibilite());

            DemandeLocation saved = demandeLocationService.creerDemande(demande);

            return ResponseEntity.ok(Map.of(
                    "idDemande", saved.getIdDemande(),
                    "message", "Demande créée avec succès"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DemandeLocation> getDemandeById(@PathVariable Long id) {
        return ResponseEntity.ok(demandeLocationService.getDemandeById(id));
    }

    @GetMapping("/etudiant/{etudiantId}")
    public ResponseEntity<List<DemandeLocationDTO>> getDemandesByEtudiant(@PathVariable Long etudiantId) {
        List<DemandeLocationDTO> result = demandeLocationService.getDemandesDTOByEtudiant(etudiantId);
        return ResponseEntity.ok(result != null ? result : List.of());
    }

    @GetMapping("/annonce/{annonceId}")
    public ResponseEntity<List<DemandeLocation>> getDemandesByAnnonce(@PathVariable Long annonceId) {
        return ResponseEntity.ok(demandeLocationService.getDemandesByAnnonce(annonceId));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<DemandeLocation> changerStatut(@PathVariable Long id, @RequestParam StatutDemande statut) {
        return ResponseEntity.ok(demandeLocationService.changerStatut(id, statut));
    }

    @GetMapping("/etudiant/{etudiantId}/derniere")
    public ResponseEntity<DemandeLocation> getDerniereDemande(@PathVariable Long etudiantId) {
        DemandeLocation d = demandeLocationService.getDerniereDemandeEtudiant(etudiantId);
        return d != null ? ResponseEntity.ok(d) : ResponseEntity.noContent().build();
    }

    @GetMapping("/etudiant/{etudiantId}/archives")
    public ResponseEntity<List<DemandeLocationDTO>> getDemandesArchiveesByEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(demandeLocationService.getDemandesArchiveesDTOByEtudiant(etudiantId));
    }

    @PutMapping("/{demandeId}/archiver")
    public ResponseEntity<?> archiverDemande(@PathVariable Long demandeId, @RequestParam Long etudiantId) {
        try {
            demandeLocationService.archiverDemande(demandeId, etudiantId);
            return ResponseEntity.ok(Map.of("message", "Demande archivée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{demandeId}/desarchiver")
    public ResponseEntity<?> desarchiverDemande(@PathVariable Long demandeId, @RequestParam Long etudiantId) {
        try {
            demandeLocationService.desarchiverDemande(demandeId, etudiantId);
            return ResponseEntity.ok(Map.of("message", "Demande désarchivée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{demandeId}")
    public ResponseEntity<?> supprimerDemande(@PathVariable Long demandeId, @RequestParam Long etudiantId) {
        try {
            demandeLocationService.supprimerDemande(demandeId, etudiantId);
            return ResponseEntity.ok(Map.of("message", "Demande supprimée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> telechargerPdf(@PathVariable Long id) {
        try {
            byte[] pdf = demandeLocationService.genererPdfDemande(id);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "inline; filename=demande-" + id + ".pdf")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/proprietaire/{proprietaireId}")
    public ResponseEntity<List<DemandeRecueProprietaireDTO>> getDemandesRecuesByProprietaire(@PathVariable Long proprietaireId) {
        return ResponseEntity.ok(demandeLocationService.getDemandesRecuesDTOByProprietaire(proprietaireId));
    }
}