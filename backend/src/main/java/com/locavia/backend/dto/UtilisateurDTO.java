package com.locavia.backend.dto;

import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.Statut;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UtilisateurDTO {
    private Long          id;
    private String        prenom;
    private String        nom;
    private String        email;
    private String        telephone;
    private Integer       age;
    private String        photoProfil;
    private String        bio;
    private Role          role;
    private Statut        statut;
    private Boolean       emailVerifie;
    private LocalDateTime creeLe;
}