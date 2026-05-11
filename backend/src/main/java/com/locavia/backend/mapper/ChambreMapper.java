package com.locavia.backend.mapper;

import com.locavia.backend.dto.ChambreDTO;
import com.locavia.backend.entity.Chambre;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ChambreMapper {

    private final PhotoMapper photoMapper;

    public ChambreDTO toDTO(Chambre c) {
        if (c == null) return null;
        return ChambreDTO.builder()
                .idChambre(c.getIdChambre())
                .titre(c.getTitre())
                .description(c.getDescription())
                .surface(c.getSurface())
                .numero(c.getNumero())
                .prixMensuel(c.getPrixMensuel())
                .etatChambre(c.getEtatChambre())
                .photos(c.getPhotos() == null ? null :
                        c.getPhotos().stream().map(photoMapper::toDTO).collect(Collectors.toList()))
                .build();
    }

    public Chambre toEntity(ChambreDTO dto) {
        if (dto == null) return null;
        return Chambre.builder()
                .idChambre(dto.getIdChambre())
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .surface(dto.getSurface())
                .numero(dto.getNumero())
                .prixMensuel(dto.getPrixMensuel())
                .etatChambre(dto.getEtatChambre())
                .photos(dto.getPhotos() == null ? null :
                        dto.getPhotos().stream().map(photoMapper::toEntity).collect(Collectors.toList()))
                .build();
    }
}