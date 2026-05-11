package com.locavia.backend.mapper;

import com.locavia.backend.dto.AdresseDTO;
import com.locavia.backend.entity.Adresse;
import org.springframework.stereotype.Component;

@Component
public class AdresseMapper {

    public AdresseDTO toDTO(Adresse a) {
        if (a == null) return null;
        return AdresseDTO.builder()
                .rue(a.getRue())
                .ville(a.getVille())
                .codePostal(a.getCodePostal())
                .pays(a.getPays())
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .build();
    }

    public Adresse toEntity(AdresseDTO dto) {
        if (dto == null) return null;
        return Adresse.builder()
                .rue(dto.getRue())
                .ville(dto.getVille())
                .codePostal(dto.getCodePostal())
                .pays(dto.getPays())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();
    }
}