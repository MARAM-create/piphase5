package com.locavia.backend.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable          // ← R3 : @Entity → @Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Adresse {
    private String rue;
    private String ville;
    private String codePostal;
    private String pays;
    private Double latitude;
    private Double longitude;
}