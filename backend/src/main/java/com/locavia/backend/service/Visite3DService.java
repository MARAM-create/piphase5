package com.locavia.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.locavia.backend.entity.Visite3D;
import com.locavia.backend.repository.Visite3DRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;


import com.locavia.backend.dto.EnvoyerVisite3DRequest;
import com.locavia.backend.entity.PartageVisite3D;
import com.locavia.backend.repository.PartageVisite3DRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
@Service
@RequiredArgsConstructor

public class Visite3DService {

    private final Visite3DRepository visite3DRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PartageVisite3DRepository partageVisite3DRepository;

    @Value("${app.upload.visite3d-dir}")
    private String visite3DDir;

    private static final Set<String> EXTENSIONS_VALIDES =
            Set.of("jpg", "jpeg", "png", "webp");





    public JsonNode publier(String metadataJson, MultipartFile[] files) {
        try {
            System.out.println("===== METADATA 3D RECU =====");
            System.out.println(metadataJson);

            JsonNode rootNode = objectMapper.readTree(metadataJson);

            if (!rootNode.hasNonNull("annonceId")) {
                throw new RuntimeException("annonceId manquant dans metadata : " + metadataJson);
            }

            Long annonceId = rootNode.get("annonceId").asLong();

            if (annonceId == null || annonceId <= 0) {
                throw new RuntimeException("annonceId invalide : " + annonceId);
            }

            Long demandeId = rootNode.hasNonNull("demandeId")
                    ? rootNode.get("demandeId").asLong()
                    : null;

            ObjectNode root = (ObjectNode) rootNode;
            ArrayNode scenes = (ArrayNode) root.withArray("scenes");

            if (scenes.isEmpty()) {
                throw new RuntimeException("Aucune pièce ajoutée");
            }

            MultipartFile[] safeFiles = files == null ? new MultipartFile[0] : files;

            for (int i = 0; i < scenes.size(); i++) {
                ObjectNode scene = (ObjectNode) scenes.get(i);

                String imageUrl;

                if (scene.hasNonNull("fileIndex")) {
                    int fileIndex = scene.get("fileIndex").asInt();

                    if (fileIndex < 0 || fileIndex >= safeFiles.length) {
                        throw new RuntimeException("Fichier image manquant pour la pièce " + (i + 1));
                    }

                    MultipartFile file = safeFiles[fileIndex];

                    if (file == null || file.isEmpty()) {
                        throw new RuntimeException("Image vide pour la pièce " + (i + 1));
                    }

                    imageUrl = stockerImage(file);

                } else if (scene.hasNonNull("existingImageUrl")) {
                    imageUrl = scene.get("existingImageUrl").asText();

                } else {
                    throw new RuntimeException("Aucune image pour la pièce " + (i + 1));
                }

                scene.put("ordre", i + 1);
                scene.put("imageUrl", imageUrl);

                scene.remove("fileIndex");
                scene.remove("existingImageUrl");
            }

            root.put("annonceId", annonceId);
            if (demandeId != null) {
                root.put("demandeId", demandeId);
            }

            root.put("statut", "PUBLIEE");
            root.put("datePublication", LocalDateTime.now().toString());

            LocalDateTime now = LocalDateTime.now();

            Visite3D visite3D = visite3DRepository
                    .findDerniereByAnnonceId(annonceId)
                    .orElse(new Visite3D());

            if (visite3D.getIdVisite3D() == null) {
                visite3D.setDateCreation(now);
            }

            visite3D.setAnnonceId(annonceId);
            visite3D.setDemandeId(demandeId);
            visite3D.setStatut("PUBLIEE");
            visite3D.setContenuJson(objectMapper.writeValueAsString(root));
            visite3D.setDatePublication(now);

            System.out.println("===== SAUVEGARDE 3D =====");
            System.out.println("annonceId = " + visite3D.getAnnonceId());
            System.out.println("demandeId = " + visite3D.getDemandeId());

            Visite3D saved = visite3DRepository.save(visite3D);

            return toResponse(saved);

        } catch (Exception e) {
            throw new RuntimeException("Erreur publication visite 3D : " + e.getMessage(), e);
        }
    }




    public JsonNode getByDemande(Long demandeId) {
        Visite3D visite3D = visite3DRepository
                .findDerniereByDemandeId(demandeId)
                .orElseThrow(() -> new RuntimeException("Aucune visite 3D publiée pour cette demande : " + demandeId));

        return toResponse(visite3D);
    }

    private String stockerImage(MultipartFile file) throws Exception {
        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = getExtension(original).toLowerCase();

        if (!EXTENSIONS_VALIDES.contains(extension)) {
            throw new RuntimeException("Format image non supporté : " + extension);
        }

        Path uploadPath = Paths.get(visite3DDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String fileName = UUID.randomUUID() + "." + extension;
        Path target = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/visites3d/" + fileName;
    }
    private JsonNode toResponse(Visite3D visite3D) {
        try {
            ObjectNode json = (ObjectNode) objectMapper.readTree(visite3D.getContenuJson());

            json.put("idVisite3D", visite3D.getIdVisite3D());
            json.put("demandeId", visite3D.getDemandeId());
            json.put("statut", visite3D.getStatut());

            if (visite3D.getDatePublication() != null) {
                json.put("datePublication", visite3D.getDatePublication().toString());
            }

            return json;

        } catch (Exception e) {
            throw new RuntimeException("Erreur lecture contenu visite 3D", e);
        }
    }

    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot >= 0 ? filename.substring(lastDot + 1) : "";
    }


    public JsonNode getByAnnonce(Long annonceId) {
        Visite3D visite3D = visite3DRepository
                .findDerniereByAnnonceId(annonceId)
                .orElseThrow(() -> new RuntimeException("Aucune visite 3D publiée pour cette annonce : " + annonceId));

        return toResponse(visite3D);
    }



    public Map<String, Object> envoyerAuxEtudiants(EnvoyerVisite3DRequest request) {
        if (request.getAnnonceId() == null) {
            throw new RuntimeException("annonceId manquant");
        }

        if (request.getDestinataires() == null || request.getDestinataires().isEmpty()) {
            throw new RuntimeException("Aucun étudiant sélectionné");
        }

        Visite3D visite3D = visite3DRepository
                .findDerniereByAnnonceId(request.getAnnonceId())
                .orElseThrow(() -> new RuntimeException("Aucune visite 3D publiée pour cette annonce"));

        int compteur = 0;

        for (EnvoyerVisite3DRequest.Destinataire3D destinataire : request.getDestinataires()) {
            if (destinataire.getDemandeId() == null || destinataire.getEtudiantId() == null) {
                continue;
            }

            boolean dejaEnvoyee = partageVisite3DRepository
                    .findByVisiteAndDemande(visite3D.getIdVisite3D(), destinataire.getDemandeId())
                    .isPresent();

            if (dejaEnvoyee) {
                continue;
            }

            PartageVisite3D partage = PartageVisite3D.builder()
                    .visite3dId(visite3D.getIdVisite3D())
                    .demandeId(destinataire.getDemandeId())
                    .etudiantId(destinataire.getEtudiantId())
                    .statut("ENVOYEE")
                    .dateEnvoi(LocalDateTime.now())
                    .build();

            partageVisite3DRepository.save(partage);
            compteur++;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Visite 3D envoyée");
        response.put("nombreEnvoyes", compteur);

        return response;
    }

    public List<Long> getDemandesPartageesEtudiant(Long etudiantId) {
        return partageVisite3DRepository.findDemandesPartageesByEtudiant(etudiantId);
    }

    public JsonNode getByDemandePartagee(Long demandeId) {
        PartageVisite3D partage = partageVisite3DRepository
                .findDernierPartageByDemande(demandeId)
                .orElseThrow(() -> new RuntimeException("Cette visite 3D n'a pas été envoyée à cet étudiant"));

        Visite3D visite3D = visite3DRepository
                .findById(partage.getVisite3dId())
                .orElseThrow(() -> new RuntimeException("Visite 3D introuvable"));

        return toResponse(visite3D);
    }


}
