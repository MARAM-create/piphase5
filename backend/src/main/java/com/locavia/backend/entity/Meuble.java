package com.locavia.backend.entity;

import com.locavia.backend.enums.EtatMeuble;
import com.locavia.backend.enums.StatutMeuble;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meubles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Meuble {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double prix;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EtatMeuble etat; // NEUF, BON_ETAT, USAGE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutMeuble statut = StatutMeuble.DISPONIBLE; // DISPONIBLE, VENDU, RESERVE

    @Column(length = 100)
    private String categorie; // ex: Lit, Bureau, Chaise...

    @Column(length = 100)
    private String ville;

    // Photos stockées comme chemins séparés par ","
    @Column(columnDefinition = "TEXT")
    private String photos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendeur_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Utilisateur vendeur;

    // L'acheteur (null tant que pas vendu)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acheteur_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Utilisateur acheteur;

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