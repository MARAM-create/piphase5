package com.locavia.backend.entity;

import com.locavia.backend.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnonceLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_annonce")
    private Long idAnnonce;

    @Version
    private Long version;

    private String titre;
    private String description;

    @Column(name = "prix_mensuel")
    private BigDecimal prixMensuel;

    @Column(name = "charges_mensuelles")
    private BigDecimal chargesMensuelles;

    @Column(name = "montant_caution")
    private BigDecimal montantCaution;

    private Double surface;

    @Column(name = "nombre_pieces")
    private Integer nombrePieces;

    private Integer etage;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_location")
    private ModeLocation modeLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_logement")
    private TypeLogement typeLogement;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_meublage")
    private TypeMeublage typeMeublage;

    @Column(name = "date_dispo_debut")
    private LocalDate dateDisponibiliteDebut;

    @Column(name = "date_dispo_fin")
    private LocalDate dateDisponibiliteFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_annonce")
    private EtatAnnonce etatAnnonce;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_moderation")
    private StatutModeration statutModeration;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    // ✅ UTILISER mappedBy pour la relation bidirectionnelle
    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    private List<Photo> photos = new ArrayList<>();

    @Embedded
    private Adresse adresse;

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Chambre> chambres = new ArrayList<>();


    @ManyToOne
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private Utilisateur proprietaire;



    //  HELPER POUR DÉFINIR LES RELATIONS BIDIRECTIONNELLES
    public void setPhotos(List<Photo> photos) {
        this.photos = new ArrayList<>(photos);
        this.photos.forEach(p -> {
            p.setAnnonce(this);
            p.setChambre(null);  // Photos au niveau annonce n'ont pas de chambre
        });
    }

    public void setChambres(List<Chambre> chambres) {
        this.chambres = new ArrayList<>(chambres);
        this.chambres.forEach(c -> c.setAnnonce(this));
    }

    @PrePersist
    public void prePersist() {
        this.dateCreation = LocalDateTime.now();
        this.dateModification = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.dateModification = LocalDateTime.now();
    }
}