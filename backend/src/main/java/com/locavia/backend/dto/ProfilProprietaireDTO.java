package com.locavia.backend.dto;
// ProfilProprietaireDTO.java

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfilProprietaireDTO {
    private Long    id;
    private String  adresse;
    private String  ville;
    private String  codePostal;
    private String  numeroFiscal;
    private Integer nbProprietes;
    private String  typeBien;
    private String  descriptionBiens;
}