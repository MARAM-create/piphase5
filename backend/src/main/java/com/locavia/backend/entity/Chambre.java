package com.locavia.backend.entity;
import com.locavia.backend.enums.*;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Chambre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_chambre")
    private Long idChambre;

    private String titre;
    private String description;
    private Double surface;
    private Integer numero;

    @Column(name = "prix_mensuel")
    private BigDecimal prixMensuel;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_chambre")
    private EtatChambre etatChambre;

    // ✅ UTILISER mappedBy pour la relation bidirectionnelle
    @OneToMany(mappedBy = "chambre", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    private List<Photo> photos = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annonce_id")
    private AnnonceLocation annonce;

    // ✅ HELPER POUR DÉFINIR LES RELATIONS BIDIRECTIONNELLES
    public void setPhotos(List<Photo> photos) {
        this.photos = new ArrayList<>(photos);
        this.photos.forEach(p -> {
            p.setChambre(this);
            p.setAnnonce(null);  // Photos au niveau chambre n'ont pas d'annonce
        });
    }
}