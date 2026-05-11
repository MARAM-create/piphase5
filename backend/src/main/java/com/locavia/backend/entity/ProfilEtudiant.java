package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "profil_etudiant")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfilEtudiant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    // ── Informations académiques ─────────────────────────────────────
    @Column(name = "universite")
    private String universite;

    @Column(name = "filiere")
    private String filiere;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_etude")
    private NiveauEtude niveauEtude;

    @Column(name = "annee_diplome")
    private Integer anneeDiplome;

    @Column(name = "numero_etudiant")
    private String numeroEtudiant;

    // ── Localisation et budget (anciens champs) ──────────────────────
    @Column(name = "ville_recherche")
    private String villeRecherche;

    @Column(name = "budget_max")
    private Double budgetMax;

    @Column(name = "type_logement")
    private String typeLogement;

    // ── Présentation personnelle ─────────────────────────────────────
    @Column(name = "description_personnelle", columnDefinition = "TEXT")
    private String descriptionPersonnelle;

    @Column(name = "hobbies", columnDefinition = "TEXT")
    private String hobbies;

    // ── Habitudes de vie ─────────────────────────────────────────────
    @Column(name = "horaire_type", length = 50)
    private String horaireType;

    @Column(name = "niveau_proprete", length = 50)
    private String niveauProprete;

    @Column(name = "frequence_invites", length = 50)
    private String frequenceInvites;

    // ── Fumeur / Animaux ─────────────────────────────────────────────
    @Column(name = "fumeur")
    private Boolean fumeur;

    @Column(name = "accepte_fumeur")
    private Boolean accepteFumeur;

    @Column(name = "a_animaux")
    private Boolean aAnimaux;

    @Column(name = "accepte_animaux")
    private Boolean accepteAnimaux;

    // ── Critères colocation ──────────────────────────────────────────
    @Column(name = "ville_recherche_colocation")
    private String villeRechercheColocation;

    @Column(name = "budget_max_colocation")
    private Double budgetMaxColocation;

    @Column(name = "tranche_age_recherche", length = 20)
    private String trancheAgeRecherche;

    @Column(name = "sexe_prefere_colocataire", length = 20)
    private String sexePrefereColocataire;

    @Column(name = "meme_universite_prefere")
    private Boolean memeUniversitePrefere;

    // ── Vecteur IA (embedding Jina AI stocké en JSON) ────────────────
    @Column(name = "vecteur_personnalite", columnDefinition = "LONGTEXT")
    private String vecteurPersonnalite;

    // ── Enum ─────────────────────────────────────────────────────────
    public enum NiveauEtude {
        LICENCE_1, LICENCE_2, LICENCE_3,
        MASTER_1, MASTER_2, DOCTORAT, AUTRE
    }
}
