package com.locavia.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class VisiteDTO {
    private Long idVisite;

    private Long demandeId;
    private Long annonceId;
    private Long etudiantId;
    private Long proprietaireId;

    private String modeVisite;
    private String statutVisite;

    private LocalDate dateVisite;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    private String meetSpaceName;
    private String meetingCode;
    private String meetUri;
    private String calendarEventId;

    private String driveFileId;
    private String videoUrl;

    private String message;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String jitsiUri;
    private String jitsiRoomName;

    // ===== champs affichage FRONT =====
    private String nomEtudiant;
    private String titreAnnonce;
    private String etudiantEmail;
    private String demandeLibelle;

    private String photoAnnonce;
    private String nomProprietaire;
    private String proprietaireEmail;
}

