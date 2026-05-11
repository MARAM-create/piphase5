package com.locavia.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DemandeReinitMdp {

    @NotBlank(message = "Le token est requis")
    private String token;

    @NotBlank(message = "Le nouveau mot de passe est requis")
    @Size(min = 8, message = "Minimum 8 caractères")
    private String nouveauMotDePasse;
}