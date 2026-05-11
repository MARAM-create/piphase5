package com.locavia.backend.dto;

// ProfilPrestataireDTO.java

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfilPrestataireDTO {
    private Long    id;
    private String  specialite;
    private Integer experienceAnnees;
    private String  certifications;
    private String  zoneIntervention;
    private Double  tarifHoraire;
    private String  disponibilite;
    private String  siteWeb;
}