package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "visite_3d")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Visite3D {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_visite3d")
    private Long idVisite3D;

    @Column(name = "id_annonce", nullable = false)
    private Long annonceId;

    @Column(name = "id_demande")
    private Long demandeId;

    @Column(nullable = false)
    private String statut;

    @Lob
    @Column(name = "contenu_json", columnDefinition = "LONGTEXT", nullable = false)
    private String contenuJson;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "date_publication")
    private LocalDateTime datePublication;

}
