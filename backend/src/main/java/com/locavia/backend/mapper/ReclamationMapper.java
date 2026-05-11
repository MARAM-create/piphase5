package com.locavia.backend.mapper;

import com.locavia.backend.dto.ReclamationDTO;
import com.locavia.backend.entity.Reclamation;
import org.springframework.stereotype.Component;

@Component
public class ReclamationMapper {

    public ReclamationDTO toDTO(Reclamation entity) {
        return ReclamationDTO.builder()
                .id(entity.getId())
                .titre(entity.getTitre())
                .description(entity.getDescription())
                .type(entity.getType())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .category(entity.getCategory())
                .email(entity.getEmail())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .resolvedAt(entity.getResolvedAt())
                .build();
    }

    public Reclamation toEntity(ReclamationDTO dto) {
        return Reclamation.builder()
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .type(dto.getType())
                .status(dto.getStatus())
                .priority(dto.getPriority())
                .category(dto.getCategory())
                .email(dto.getEmail())
                .build();
    }

    public void updateEntity(Reclamation entity, ReclamationDTO dto) {
        entity.setTitre(dto.getTitre());
        entity.setDescription(dto.getDescription());
        entity.setType(dto.getType());
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        if (dto.getPriority() != null) {
            entity.setPriority(dto.getPriority());
        }
        if (dto.getCategory() != null) {
            entity.setCategory(dto.getCategory());
        }
        if (dto.getEmail() != null) {
            entity.setEmail(dto.getEmail());
        }
    }
}
