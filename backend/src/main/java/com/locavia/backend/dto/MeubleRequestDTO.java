package com.locavia.backend.dto;

import com.locavia.backend.enums.EtatMeuble;
import lombok.Data;

@Data
public class MeubleRequestDTO {
    private String titre;
    private String description;
    private Double prix;
    private EtatMeuble etat;
    private String categorie;
    private String ville;
}