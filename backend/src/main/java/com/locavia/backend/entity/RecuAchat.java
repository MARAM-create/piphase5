package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recus_achat")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecuAchat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_recu", unique = true, nullable = false)
    private String numeroRecu;

    @Column(name = "hash_sha256", nullable = false)
    private String hashSha256;

    @Column(name = "titre_meuble")
    private String titreMeuble;

    @Column(name = "prix_meuble")
    private Double prixMeuble;

    @Column(name = "nom_acheteur")
    private String nomAcheteur;

    @Column(name = "email_acheteur")
    private String emailAcheteur;

    @Column(name = "nom_vendeur")
    private String nomVendeur;

    @Column(name = "nom_transporteur")
    private String nomTransporteur;

    @Column(name = "date_achat", updatable = false)
    private LocalDateTime dateAchat;

    @Column(name = "valide")
    @Builder.Default
    private Boolean valide = true;

    @PrePersist
    protected void avantCreation() {
        this.dateAchat = LocalDateTime.now();
    }
}