package com.locavia.backend.dto;

import com.locavia.backend.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DemandeInscription {

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    private String telephone;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    @NotBlank(message = "Le token reCAPTCHA est requis")
    private String recaptchaToken;
}
