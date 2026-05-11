package com.locavia.backend.dto;

import com.locavia.backend.enums.EtatChambre;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChambreDTO {
    private Long idChambre;
    private String titre;
    private String description;
    private Double surface;
    private Integer numero;
    private BigDecimal prixMensuel;
    private EtatChambre etatChambre;
    private List<PhotoDTO> photos;   // ← R2
}