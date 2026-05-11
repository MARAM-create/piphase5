package com.locavia.backend.dto;

import com.locavia.backend.enums.ReclamationPriority;
import com.locavia.backend.enums.ReclamationStatus;
import com.locavia.backend.enums.ReclamationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReclamationDTO {

    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotNull(message = "Le type est obligatoire")
    private ReclamationType type;

    private ReclamationStatus status;

    private ReclamationPriority priority;

    private String category;

    @Email(message = "Format email invalide")
    private String email;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;
}
