package com.locavia.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class DemandeServiceRequestDTO {
    private Long prestataireId;
    private LocalDate dateService;
    private LocalTime heureService;
    private String probleme;
    private String adresse;
    private String ville;
}