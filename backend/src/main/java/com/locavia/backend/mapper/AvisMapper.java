package com.locavia.backend.mapper;

import com.locavia.backend.dto.AvisDTO;
import com.locavia.backend.entity.Avis;
import org.springframework.stereotype.Component;

@Component
public class AvisMapper {

    public AvisDTO toDTO(Avis entity) {
        return AvisDTO.builder()
                .id(entity.getId())
                .titre(entity.getTitre())
                .commentaire(entity.getCommentaire())
                .rating(entity.getRating())
                .sentiment(entity.getSentiment())
                .trusted(entity.getTrusted())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public Avis toEntity(AvisDTO dto) {
        return Avis.builder()
                .titre(dto.getTitre())
                .commentaire(dto.getCommentaire())
                .rating(dto.getRating())
                .sentiment(dto.getSentiment())
                .trusted(dto.getTrusted() != null ? dto.getTrusted() : true)
                .build();
    }

    public void updateEntity(Avis entity, AvisDTO dto) {
        entity.setTitre(dto.getTitre());
        entity.setCommentaire(dto.getCommentaire());
        entity.setRating(dto.getRating());
    }
}
