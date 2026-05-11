package com.locavia.backend.entity;

import com.locavia.backend.enums.ModeVisite;
import com.locavia.backend.enums.StatutVisite;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "visite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Visite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idVisite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_location_id", nullable = false)
    private DemandeLocation demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annonce_id", nullable = false)
    private AnnonceLocation annonce;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Utilisateur etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private Utilisateur proprietaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModeVisite modeVisite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutVisite statutVisite = StatutVisite.NON_TRAITEE;

    private LocalDate dateVisite;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    @Column(length = 255)
    private String meetSpaceName;

    @Column(length = 255)
    private String meetingCode;

    @Column(length = 500)
    private String meetUri;

    @Column(length = 255)
    private String calendarEventId;

    @Column(length = 255)
    private String driveFileId;

    @Column(length = 500)
    private String videoUrl;

    @Column(length = 2000)
    private String message;
    @Column(name = "jitsi_uri")
    private String jitsiUri;

    @Column(name = "jitsi_room_name")
    private String jitsiRoomName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (statutVisite == null) {
            statutVisite = StatutVisite.NON_TRAITEE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
