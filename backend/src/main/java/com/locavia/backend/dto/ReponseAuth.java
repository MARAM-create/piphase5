package com.locavia.backend.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReponseAuth {
    private String       token;
    private UtilisateurDTO utilisateur;
}