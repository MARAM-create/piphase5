package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profil_prestataire")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfilPrestataire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "specialite")
    private String specialite;

    @Column(name = "experience_annees")
    private Integer experienceAnnees;

    @Column(name = "certifications", columnDefinition = "TEXT")
    private String certifications;

    @Column(name = "zone_intervention")
    private String zoneIntervention;

    @Column(name = "tarif_horaire")
    private Double tarifHoraire;

    @Column(name = "disponibilite")
    private String disponibilite;

    @Column(name = "site_web")
    private String siteWeb;
}