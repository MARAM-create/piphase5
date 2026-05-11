package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "profil_proprietaire")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfilProprietaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "adresse")
    private String adresse;

    @Column(name = "ville")
    private String ville;

    @Column(name = "code_postal")
    private String codePostal;

    @Column(name = "numero_fiscal")
    private String numeroFiscal;

    @Column(name = "nb_proprietes")
    private Integer nbProprietes;

    @Column(name = "type_bien")
    private String typeBien;

    @Column(name = "description_biens", columnDefinition = "TEXT")
    private String descriptionBiens;
}