package com.locavia.backend.controller;

import com.locavia.backend.dto.FurnitureVerificationResult;
import com.locavia.backend.dto.MeubleRequestDTO;
import com.locavia.backend.dto.MeubleResponseDTO;
import com.locavia.backend.dto.ProfilPrestataireResponseDTO;
import com.locavia.backend.service.FurnitureVerificationService;
import com.locavia.backend.service.MeubleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meubles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MeubleController {

    private final FurnitureVerificationService furnitureService;
    private final MeubleService meubleService;

    // POST /api/meubles — Publier un meuble avec vérification IA
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> publier(
            @RequestPart("meuble") MeubleRequestDTO dto,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) throws IOException {

        /*
         * Vérification IA :
         * On vérifie la première photo envoyée.
         * Si aucune photo n'est fournie, tu peux soit refuser,
         * soit continuer selon ta logique métier.
         */
        if (photos == null || photos.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "IMAGE_REQUIRED",
                            "message", "Veuillez ajouter au moins une photo du meuble."
                    ));
        }

        MultipartFile imagePrincipale = photos.get(0);

        FurnitureVerificationResult result = furnitureService.verify(imagePrincipale);

        if (!result.isFurniture()) {
            return ResponseEntity
                    .status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of(
                            "error", "IMAGE_NON_MEUBLE",
                            "message", result.getMessage()
                    ));
        }

        // Suite normale : publication du meuble
        MeubleResponseDTO response = meubleService.publierMeuble(dto, photos);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // GET /api/meubles — Lister tous les meubles disponibles
    @GetMapping
    public ResponseEntity<List<MeubleResponseDTO>> lister() {
        return ResponseEntity.ok(meubleService.listerMeubles());
    }

    // GET /api/meubles/{id} — Détail
    @GetMapping("/{id}")
    public ResponseEntity<MeubleResponseDTO> detail(@PathVariable Long id) {
        return ResponseEntity.ok(meubleService.getDetail(id));
    }

    // GET /api/meubles/mes-meubles — Mes meubles
    @GetMapping("/mes-meubles")
    public ResponseEntity<List<MeubleResponseDTO>> mesMeubles() {
        return ResponseEntity.ok(meubleService.mesMeubles());
    }

    // PUT /api/meubles/{id} — Modifier un meuble avec vérification IA
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> modifier(
            @PathVariable Long id,
            @RequestPart("meuble") MeubleRequestDTO dto,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) throws IOException {

        /*
         * Ici, on vérifie uniquement si de nouvelles photos sont envoyées.
         * Si aucune nouvelle photo n'est envoyée, on laisse la modification continuer.
         */
        if (photos != null && !photos.isEmpty()) {
            MultipartFile imagePrincipale = photos.get(0);

            FurnitureVerificationResult result = furnitureService.verify(imagePrincipale);

            if (!result.isFurniture()) {
                return ResponseEntity
                        .status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of(
                                "error", "IMAGE_NON_MEUBLE",
                                "message", result.getMessage()
                        ));
            }
        }

        MeubleResponseDTO response = meubleService.modifierMeuble(id, dto, photos);

        return ResponseEntity.ok(response);
    }

    // DELETE /api/meubles/{id} — Supprimer
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        meubleService.supprimerMeuble(id);
        return ResponseEntity.noContent().build();
    }

    // POST /api/meubles/{id}/acheter — Acheter
    @PostMapping("/{id}/acheter")
    public ResponseEntity<MeubleResponseDTO> acheter(@PathVariable Long id) {
        return ResponseEntity.ok(meubleService.acheterMeuble(id));
    }

    // GET /api/meubles/prestataires-demenagement
    @GetMapping("/prestataires-demenagement")
    public ResponseEntity<List<ProfilPrestataireResponseDTO>> getPrestatairesDemo() {
        return ResponseEntity.ok(meubleService.getPrestatairesDemo());
    }

    // POST /api/meubles/{id}/recu-sans-transport
    @PostMapping("/{id}/recu-sans-transport")
    public ResponseEntity<Void> recuSansTransport(@PathVariable Long id) {
        meubleService.envoyerRecuSansTransport(id);
        return ResponseEntity.ok().build();
    }

    // GET /api/meubles/mes-achats
    @GetMapping("/mes-achats")
    public ResponseEntity<List<MeubleResponseDTO>> mesAchats() {
        return ResponseEntity.ok(meubleService.mesAchats());
    }

    // POST /api/meubles/{id}/rendre-disponible
    @PostMapping("/{id}/rendre-disponible")
    public ResponseEntity<MeubleResponseDTO> rendreDisponible(@PathVariable Long id) {
        return ResponseEntity.ok(meubleService.rendreDisponible(id));
    }

    // POST /api/meubles/verify-image — Vérifier une image avant soumission
    @PostMapping("/verify-image")
    public ResponseEntity<FurnitureVerificationResult> verifyImage(
            @RequestParam("image") MultipartFile image
    ) {
        FurnitureVerificationResult result = furnitureService.verify(image);
        return ResponseEntity.ok(result);
    }
}