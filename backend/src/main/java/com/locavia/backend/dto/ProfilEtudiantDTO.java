package com.locavia.backend.dto;

import com.locavia.backend.entity.ProfilEtudiant.NiveauEtude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfilEtudiantDTO {
    private Long    id;
    private String  universite;
    private String  filiere;
    private NiveauEtude niveauEtude;
    private Integer anneeDiplome;
    private String  numeroEtudiant;
    private String  villeRecherche;
    private Double  budgetMax;
    private String  typeLogement;
}
