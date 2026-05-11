package com.locavia.backend.entity;

import com.locavia.backend.enums.FormatVisiteSouhaite;
import com.locavia.backend.enums.StatutDemande;
import com.locavia.backend.enums.TypeVisiteSouhaitee;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "demande_location")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandeLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_demande")
    private Long idDemande;

    @Column(name = "date_demande", nullable = false)
    private LocalDateTime dateDemande;

    @Column(name = "message_candidat", columnDefinition = "TEXT", nullable = false)
    private String messageCandidat;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_demande", nullable = false)
    private StatutDemande statutDemande;

    // ── Étape 2 : Préférences ──────────────────────────────
    @Column(name = "nombre_personnes", nullable = false)
    private Integer nombrePersonnes;

    @Column(name = "date_entree")
    private LocalDate dateEntree;

    @Column(name = "duree_location")
    private String dureeLocation;

    @Column(name = "budget")
    private Double budget;

    @Column(name = "ville_actuelle")
    private String villeActuelle;

    @Column(name = "critere_principal")
    private String criterePrincipal;

    @Column(name = "besoin_principal")
    private String besoinPrincipal;

    @Column(name = "remarque_logement", columnDefinition = "TEXT")
    private String remarqueLogement;

    // ── Étape 3 : Mode visite ──────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "type_visite", nullable = false)
    private TypeVisiteSouhaitee typeVisite;

    @Enumerated(EnumType.STRING)
    @Column(name = "format_visite")
    private FormatVisiteSouhaite formatVisite;

    @Column(name = "moment_visite")
    private String momentVisite;

    // ── Étape 4 : Disponibilités ───────────────────────────
    @Column(name = "date_souhaitee")
    private LocalDate dateSouhaitee;

    @Column(name = "jours_disponibles")
    private String joursDisponibles;


    @Column(name = "archive")
    private Boolean archive = false;

    @Column(name = "supprime")
    private Boolean supprime = false;

    @PrePersist
    void initDefaults() {
        if (archive == null) archive = false;
        if (supprime == null) supprime = false;
    }
    @Column(name = "plage_horaire")
    private String plageHoraire;


    @Column(name = "remarque_disponibilite", columnDefinition = "TEXT")
    private String remarqueDisponibilite;

    // ── Relations ──────────────────────────────────────────
    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Utilisateur etudiant;

    public void setStatutDemande(StatutDemande statutDemande) {
        this.statutDemande = statutDemande;
    }

    @ManyToOne
    @JoinColumn(name = "annonce_id", nullable = false)
    private AnnonceLocation annonce;
}