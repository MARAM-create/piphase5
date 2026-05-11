package com.locavia.backend.service;

import com.locavia.backend.dto.GoogleMeetCreateResponse;
import com.locavia.backend.dto.VisiteDTO;
import com.locavia.backend.entity.*;
import com.locavia.backend.enums.ModeVisite;
import com.locavia.backend.enums.StatutVisite;
import com.locavia.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardCopyOption;
import java.util.List;
@Service
@RequiredArgsConstructor
public class VisiteService {



    private final VisiteRepository visiteRepository;
    private final DemandeLocationRepository demandeLocationRepository;
    private final AnnonceLocationRepository annonceLocationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final GoogleMeetService googleMeetService;
    private final PhotoRepository photoRepository;
    @Transactional
    public VisiteDTO creerOuMettreAJour(VisiteDTO dto) {
        ModeVisite mode = ModeVisite.valueOf(dto.getModeVisite());

        DemandeLocation demande = demandeLocationRepository.findById(dto.getDemandeId())
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        String formatDemande = demande.getFormatVisite() != null
                ? demande.getFormatVisite().name()
                : "";

        Visite visite;

        if (dto.getIdVisite() != null) {
            visite = visiteRepository.findById(dto.getIdVisite()).orElse(new Visite());
        } else if ("LES_DEUX".equalsIgnoreCase(formatDemande)) {
            visite = visiteRepository
                    .findByDemandeIdDemandeAndModeVisite(dto.getDemandeId(), mode)
                    .orElse(new Visite());
        } else {
            visite = visiteRepository
                    .findByDemandeIdDemande(dto.getDemandeId())
                    .orElse(new Visite());
        }

        AnnonceLocation annonce = annonceLocationRepository.findById(dto.getAnnonceId())
                .orElseThrow(() -> new RuntimeException("Annonce introuvable"));

        Utilisateur etudiant = utilisateurRepository.findById(dto.getEtudiantId())
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        Utilisateur proprietaire = utilisateurRepository.findById(dto.getProprietaireId())
                .orElseThrow(() -> new RuntimeException("Propriétaire introuvable"));

        visite.setDemande(demande);
        visite.setAnnonce(annonce);
        visite.setEtudiant(etudiant);
        visite.setProprietaire(proprietaire);
        visite.setModeVisite(mode);

        visite.setStatutVisite(
                dto.getStatutVisite() != null
                        ? StatutVisite.valueOf(dto.getStatutVisite())
                        : StatutVisite.NON_TRAITEE
        );

        visite.setDateVisite(dto.getDateVisite());
        visite.setHeureDebut(dto.getHeureDebut());
        visite.setHeureFin(dto.getHeureFin());
        visite.setMessage(dto.getMessage());

        // -------------------------
        // CAS VIDEO PRE-ENREGISTREE
        // -------------------------
        if (mode == ModeVisite.VIDEO) {
            visite.setVideoUrl(dto.getVideoUrl());

            // on vide tout ce qui concerne la visio live
            visite.setMeetSpaceName(null);
            visite.setMeetingCode(null);
            visite.setMeetUri(null);
            visite.setCalendarEventId(null);

            visite.setJitsiUri(null);
            visite.setJitsiRoomName(null);
        }

        // -------------------------
        // CAS VISITE DIRECTE
        // -------------------------
        if (mode == ModeVisite.DIRECT) {
            // une visite directe n'utilise pas videoUrl
            visite.setVideoUrl(null);

            // -------------------------
            // JITSI : on garde / génère
            // -------------------------
            String roomName = dto.getJitsiRoomName();

            if (roomName != null && !roomName.isBlank()) {
                visite.setJitsiRoomName(roomName);
                visite.setJitsiUri("https://meet.jit.si/" + roomName);
            } else if (dto.getJitsiUri() != null && !dto.getJitsiUri().isBlank()) {
                visite.setJitsiUri(dto.getJitsiUri());
            }

            // -------------------------
            // GOOGLE MEET : on garde si envoyé par le front
            // -------------------------
            if (dto.getMeetSpaceName() != null && !dto.getMeetSpaceName().isBlank()) {
                visite.setMeetSpaceName(dto.getMeetSpaceName());
            }

            if (dto.getMeetingCode() != null && !dto.getMeetingCode().isBlank()) {
                visite.setMeetingCode(dto.getMeetingCode());
            }

            if (dto.getMeetUri() != null && !dto.getMeetUri().isBlank()) {
                visite.setMeetUri(dto.getMeetUri());
            }

            if (dto.getCalendarEventId() != null && !dto.getCalendarEventId().isBlank()) {
                visite.setCalendarEventId(dto.getCalendarEventId());
            }
        }
        // 1) sauvegarde d'abord pour avoir un id
        Visite saved = visiteRepository.save(visite);

        // 2) si DIRECT + pas de Jitsi + pas de Meet => génération Google Meet
        // 2) pour une visite DIRECT, générer automatiquement Jitsi + Meet s'ils manquent
        if (saved.getModeVisite() == ModeVisite.DIRECT) {

            // -------- Génération Jitsi --------
            if (saved.getJitsiRoomName() == null || saved.getJitsiRoomName().isBlank()) {
                saved.setJitsiRoomName("locavia-visite-" + saved.getIdVisite());
            }

            if (saved.getJitsiUri() == null || saved.getJitsiUri().isBlank()) {
                saved.setJitsiUri("https://meet.jit.si/" + saved.getJitsiRoomName());
            }

            // -------- Génération Google Meet --------
            if (saved.getMeetUri() == null || saved.getMeetUri().isBlank()) {
                try {
                    GoogleMeetCreateResponse meet = googleMeetService.createMeetingSpace();

                    saved.setMeetSpaceName(meet.getName());
                    saved.setMeetingCode(meet.getMeetingCode());
                    saved.setMeetUri(meet.getMeetingUri());
                } catch (Exception e) {
                    System.out.println("ERREUR GOOGLE MEET = " + e.getMessage());
                    e.printStackTrace();
                }
            }

            // -------- Statut --------
            if ((saved.getMeetUri() != null && !saved.getMeetUri().isBlank())
                    || (saved.getJitsiUri() != null && !saved.getJitsiUri().isBlank())) {
                saved.setStatutVisite(StatutVisite.LIEN_ENVOYE);
            }

            saved = visiteRepository.save(saved);
        }

        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<VisiteDTO> getByProprietaire(Long proprietaireId) {
        return visiteRepository.findByProprietaireIdOrderByCreatedAtDesc(proprietaireId)
                .stream()
                .map(this::toDTO)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<VisiteDTO> getByEtudiant(Long etudiantId) {
        return visiteRepository.findByEtudiantIdOrderByCreatedAtDesc(etudiantId)
                .stream()
                .map(this::toDTO)
                .toList();
    }



    private VisiteDTO toDTO(Visite visite) {
        VisiteDTO dto = new VisiteDTO();

        dto.setIdVisite(visite.getIdVisite());

        dto.setDemandeId(visite.getDemande() != null ? visite.getDemande().getIdDemande() : null);
        dto.setAnnonceId(visite.getAnnonce() != null ? visite.getAnnonce().getIdAnnonce() : null);
        dto.setEtudiantId(visite.getEtudiant() != null ? visite.getEtudiant().getId() : null);
        dto.setProprietaireId(visite.getProprietaire() != null ? visite.getProprietaire().getId() : null);

        dto.setModeVisite(visite.getModeVisite() != null ? visite.getModeVisite().name() : null);
        dto.setStatutVisite(visite.getStatutVisite() != null ? visite.getStatutVisite().name() : null);

        dto.setDateVisite(visite.getDateVisite());
        dto.setHeureDebut(visite.getHeureDebut());
        dto.setHeureFin(visite.getHeureFin());

        dto.setMeetSpaceName(visite.getMeetSpaceName());
        dto.setMeetingCode(visite.getMeetingCode());
        dto.setMeetUri(visite.getMeetUri());
        dto.setCalendarEventId(visite.getCalendarEventId());

        dto.setDriveFileId(visite.getDriveFileId());
        dto.setVideoUrl(visite.getVideoUrl());
        dto.setMessage(visite.getMessage());

        dto.setJitsiUri(visite.getJitsiUri());
        dto.setJitsiRoomName(visite.getJitsiRoomName());

        dto.setCreatedAt(visite.getCreatedAt());
        dto.setUpdatedAt(visite.getUpdatedAt());

        if (visite.getEtudiant() != null) {
            dto.setNomEtudiant(buildNomComplet(visite.getEtudiant()));
            dto.setEtudiantEmail(visite.getEtudiant().getEmail());
        }

        if (visite.getProprietaire() != null) {
            dto.setNomProprietaire(buildNomComplet(visite.getProprietaire()));
            dto.setProprietaireEmail(visite.getProprietaire().getEmail());
        }

        if (visite.getDemande() != null) {
            dto.setDemandeLibelle("Demande #" + visite.getDemande().getIdDemande());
        }

        if (visite.getAnnonce() != null) {
            dto.setTitreAnnonce(
                    visite.getAnnonce().getTitre() != null && !visite.getAnnonce().getTitre().isBlank()
                            ? visite.getAnnonce().getTitre()
                            : "Annonce #" + visite.getAnnonce().getIdAnnonce()
            );

            List<Photo> photos = photoRepository.findByAnnonceIdAnnonceOrderByOrdreAsc(
                    visite.getAnnonce().getIdAnnonce()
            );

            if (photos != null && !photos.isEmpty() && photos.get(0).getUrl() != null) {
                dto.setPhotoAnnonce(photos.get(0).getUrl());
            }
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public VisiteDTO getById(Long idVisite) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new RuntimeException("Visite introuvable"));
        return toDTO(visite);
    }
    @Transactional(readOnly = true)
    public VisiteDTO getByDemande(Long demandeId) {
        Visite visite = visiteRepository
                .findByDemandeIdDemande(demandeId)
                .orElseThrow(() -> new RuntimeException("Visite introuvable"));

        return toDTO(visite);
    }

    private String buildNomComplet(Utilisateur utilisateur) {
        if (utilisateur == null) return null;

        String prenom = utilisateur.getPrenom() != null ? utilisateur.getPrenom().trim() : "";
        String nom = utilisateur.getNom() != null ? utilisateur.getNom().trim() : "";

        String fullName = (prenom + " " + nom).trim();

        if (!fullName.isEmpty()) {
            return fullName;
        }

        if (utilisateur.getEmail() != null && !utilisateur.getEmail().isBlank()) {
            return utilisateur.getEmail();
        }

        return "Utilisateur #" + utilisateur.getId();
    }

    @Transactional
    public VisiteDTO modifierVideoVisite(
            Long idVisite,
            Long demandeId,
            String message,
            MultipartFile file
    ) {
        try {
            Visite visite = visiteRepository.findById(idVisite)
                    .orElseThrow(() -> new RuntimeException("Visite introuvable"));

            if (file == null || file.isEmpty()) {
                throw new RuntimeException("Aucun fichier vidéo reçu");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                throw new RuntimeException("Le fichier envoyé n'est pas une vidéo valide");
            }

            String uploadDir = "uploads/visites/videos";
            Path dossier = Paths.get(uploadDir);

            if (!Files.exists(dossier)) {
                Files.createDirectories(dossier);
            }

            String extension = "";
            String originalFilename = file.getOriginalFilename();

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String nomFichier = "visite_" + idVisite + "_" + System.currentTimeMillis() + extension;
            Path cheminFichier = dossier.resolve(nomFichier);

            Files.copy(file.getInputStream(), cheminFichier, StandardCopyOption.REPLACE_EXISTING);

            String videoUrl = "/uploads/visites/videos/" + nomFichier;

            visite.setModeVisite(ModeVisite.VIDEO);
            visite.setVideoUrl(videoUrl);

            if (message != null) {
                visite.setMessage(message);
            }

            Visite visiteSauvegardee = visiteRepository.save(visite);

            return convertirEnDTO(visiteSauvegardee);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la modification de la vidéo : " + e.getMessage());
        }
    }

    private VisiteDTO convertirEnDTO(Visite visite) {
        if (visite == null) {
            return null;
        }

        VisiteDTO dto = new VisiteDTO();

        dto.setIdVisite(visite.getIdVisite());

        if (visite.getDemande() != null) {
            dto.setDemandeId(visite.getDemande().getIdDemande());

            if (visite.getDemande().getAnnonce() != null) {
                dto.setAnnonceId(visite.getDemande().getAnnonce().getIdAnnonce());
            }

            if (visite.getDemande().getEtudiant() != null) {
                dto.setNomEtudiant(visite.getDemande().getEtudiant().getNom());
                dto.setEtudiantEmail(visite.getDemande().getEtudiant().getEmail());
            }
        }

        dto.setStatutVisite(visite.getStatutVisite() != null ? visite.getStatutVisite().name() : null);

        dto.setDateVisite(visite.getDateVisite());
        dto.setHeureDebut(visite.getHeureDebut());
        dto.setHeureFin(visite.getHeureFin());

        dto.setJitsiUri(visite.getJitsiUri());

        dto.setVideoUrl(visite.getVideoUrl());
        dto.setMessage(visite.getMessage());

        return dto;
    }
}
