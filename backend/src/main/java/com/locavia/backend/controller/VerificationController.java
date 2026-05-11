package com.locavia.backend.controller;

import com.locavia.backend.entity.RecuAchat;
import com.locavia.backend.repository.RecuAchatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/verification")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class VerificationController {

    private final RecuAchatRepository recuRepository;

    @GetMapping("/recu/{numero}")
    public ResponseEntity<?> verifierRecu(@PathVariable String numero) {
        try {
            Optional<RecuAchat> recuOpt = recuRepository.findByNumeroRecu(numero);

            if (recuOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "valide",  false,
                        "message", "Aucun document trouvé avec ce numéro",
                        "numero",  numero
                ));
            }

            RecuAchat recu = recuOpt.get();

            return ResponseEntity.ok(Map.ofEntries(
                    Map.entry("valide",          recu.getValide()),
                    Map.entry("message",         recu.getValide()
                            ? "Document authentique et valide"
                            : "Document marqué comme invalide"),
                    Map.entry("numero",          recu.getNumeroRecu()),
                    Map.entry("dateAchat",       recu.getDateAchat() != null
                            ? recu.getDateAchat().toString() : ""),
                    Map.entry("emetteur",        "Locavia Platform"),
                    Map.entry("titreMeuble",     recu.getTitreMeuble()    != null ? recu.getTitreMeuble()    : ""),
                    Map.entry("prixMeuble",      recu.getPrixMeuble()     != null ? recu.getPrixMeuble()     : 0.0),
                    Map.entry("nomAcheteur",     recu.getNomAcheteur()    != null ? recu.getNomAcheteur()    : ""),
                    Map.entry("nomVendeur",      recu.getNomVendeur()     != null ? recu.getNomVendeur()     : ""),
                    Map.entry("nomTransporteur", recu.getNomTransporteur()!= null ? recu.getNomTransporteur(): ""),
                    Map.entry("hash",            recu.getHashSha256()     != null ? recu.getHashSha256()     : "")
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "valide",  false,
                    "message", "Erreur serveur : " + e.getMessage()
            ));
        }
    }
}