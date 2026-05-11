package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "annonces_service")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnonceService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TypeService typeService; // TRANSPORT, NETTOYAGE, MAINTENANCE

    private String titre;
    private String description;
    private Double tarif;
    private String zone; // zone de couverture
    private String disponibilites; // ex: "Lun-Ven 8h-18h"
    private String specialite; // pour maintenance : PLOMBERIE, ELECTRICITE...
    private String capaciteVehicule; // pour transport
    private String photos;

    @Enumerated(EnumType.STRING)
    private StatutAnnonce statut; // EN_ATTENTE, ACTIVE, SUSPENDUE

    private Long agentId; // référence vers le user agent

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public enum TypeService { TRANSPORT, NETTOYAGE, MAINTENANCE }
    public enum StatutAnnonce { EN_ATTENTE, ACTIVE, SUSPENDUE }
}