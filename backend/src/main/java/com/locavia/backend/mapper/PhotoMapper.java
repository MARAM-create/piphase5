package com.locavia.backend.mapper;

import com.locavia.backend.dto.PhotoDTO;
import com.locavia.backend.entity.Photo;
import org.springframework.stereotype.Component;

@Component
public class PhotoMapper {

    public PhotoDTO toDTO(Photo p) {
        if (p == null) return null;
        return PhotoDTO.builder()
                .id(p.getId())
                .url(p.getUrl())
                .altText(p.getAltText())
                .ordre(p.getOrdre())
                .dateUpload(p.getDateUpload())
                .build();
    }

    public Photo toEntity(PhotoDTO dto) {
        if (dto == null) return null;
        return Photo.builder()
                .id(dto.getId())
                .url(dto.getUrl())
                .altText(dto.getAltText())
                .ordre(dto.getOrdre())
                .build();
    }
}