package com.locavia.backend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdresseDTO {
    private String rue;
    private String ville;
    private String codePostal;
    private String pays;
    private Double latitude;
    private Double longitude;
}