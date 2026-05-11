package com.locavia.backend.entity;

import com.locavia.backend.enums.StatutDemande;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "demandes_service")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandeService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "demandeur_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Utilisateur demandeur;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "prestataire_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Utilisateur prestataire;

    @Column(nullable = false)
    private LocalDate dateService;

    @Column(nullable = false)
    private LocalTime heureService;

    @Column(columnDefinition = "TEXT")
    private String probleme;

    @Column(length = 200)
    private String adresse;

    @Column(length = 100)
    private String ville;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    @Column(name = "cree_le", updatable = false)
    private LocalDateTime creeLe;

    @Column(name = "mis_a_jour_le")
    private LocalDateTime misAJourLe;

    @PrePersist
    protected void avantCreation() {
        this.creeLe = LocalDateTime.now();
        this.misAJourLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void avantMiseAJour() {
        this.misAJourLe = LocalDateTime.now();
    }
}