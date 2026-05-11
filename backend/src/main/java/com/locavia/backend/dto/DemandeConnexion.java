package com.locavia.backend.dto;


import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class  DemandeConnexion {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;

    private String recaptchaToken;
}