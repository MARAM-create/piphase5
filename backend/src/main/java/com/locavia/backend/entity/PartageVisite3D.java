package com.locavia.backend.entity;



import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "partage_visite_3d")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartageVisite3D {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_partage")
    private Long idPartage;

    @Column(name = "id_visite3d", nullable = false)
    private Long visite3dId;

    @Column(name = "id_demande", nullable = false)
    private Long demandeId;

    @Column(name = "etudiant_id", nullable = false)
    private Long etudiantId;

    @Column(nullable = false)
    private String statut; // ENVOYEE, VUE

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi;
}
