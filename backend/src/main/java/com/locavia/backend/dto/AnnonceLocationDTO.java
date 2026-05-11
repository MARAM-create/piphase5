// AnnonceLocationDTO.java
package com.locavia.backend.dto;

import com.locavia.backend.enums.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AnnonceLocationDTO {
    private Long idAnnonce;
    private Long version;
    private String titre;
    private String description;
    private BigDecimal prixMensuel;
    private BigDecimal chargesMensuelles;
    private BigDecimal montantCaution;
    private Double surface;
    private Integer nombrePieces;
    private Integer etage;
    private ModeLocation modeLocation;
    private TypeLogement typeLogement;
    private TypeMeublage typeMeublage;
    private LocalDate dateDisponibiliteDebut;
    private LocalDate dateDisponibiliteFin;
    private EtatAnnonce etatAnnonce;
    private StatutModeration statutModeration;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private List<PhotoDTO> photos;
    private AdresseDTO adresse;
    private List<ChambreDTO> chambres;
    private Long proprietaireId; // ← add this

}