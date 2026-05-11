package com.locavia.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.NoArgsConstructor;
import com.locavia.backend.enums.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entité principale — Contrat de location.
 * Lie un locataire et un bailleur à une annonce via une demande acceptée.
 */
@Entity
@Getter
@Setter
@ToString(exclude = {"demande", "locataire", "bailleur", "annonce", "paiements"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Relations ────────────────────────────────────────────

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", unique = true)
    @JsonIgnore
    private DemandeLocation demande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locataire_id", nullable = false)
    @JsonIgnore
    private Utilisateur locataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bailleur_id", nullable = false)
    @JsonIgnore
    private Utilisateur bailleur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annonce_id", nullable = false)
    @JsonIgnore
    private AnnonceLocation annonce;

    // ── Champs métier ────────────────────────────────────────

    private String pdfViergeUrl;

    private String imageScanneUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IAValidationStatus iaValidationStatus = IAValidationStatus.PENDING;
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutIa statutIa;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutContrat statutContrat;

    @Column(columnDefinition = "TEXT")
    private String raisonIa;

    // ── Calendrier de paiement ───────────────────────────────

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private LocalDateTime prochainPaiement;
    // ── Relation inverse (pour navigation) ───────────────────

    @OneToMany(mappedBy = "contrat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TransactionPaiement> paiements;
}

