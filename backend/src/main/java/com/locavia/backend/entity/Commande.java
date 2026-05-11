package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long meubleId;
    private Long acheteurId;
    private Long vendeurId;
    private Long transporteurId;
    private Boolean avecTransporteur;

    @Enumerated(EnumType.STRING)
    private StatutCommande statut;

    private LocalDateTime dateCommande;
    private LocalDateTime dateLivraison;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        dateCommande = LocalDateTime.now();
    }

    public enum StatutCommande {
        EN_ATTENTE, EN_COURS_LIVRAISON, LIVRE, ANNULE
    }
}