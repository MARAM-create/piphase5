package com.locavia.backend.dto;

import com.locavia.backend.enums.StatutDemande;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class DisponibiliteDTO {
    private LocalDate dateService;
    private LocalTime heureService;
    private StatutDemande statut;
}