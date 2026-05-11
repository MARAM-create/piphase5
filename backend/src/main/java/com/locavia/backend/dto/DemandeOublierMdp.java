package com.locavia.backend.dto;


import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DemandeOublierMdp {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;
}