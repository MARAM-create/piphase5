package com.locavia.backend.mapper;

import com.locavia.backend.dto.AnnonceLocationDTO;
import com.locavia.backend.entity.AnnonceLocation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AnnonceLocationMapper {

    private final AdresseMapper adresseMapper;
    private final ChambreMapper chambreMapper;
    private final PhotoMapper   photoMapper;

    public AnnonceLocationDTO toDTO(AnnonceLocation a) {
        if (a == null) return null;
        return AnnonceLocationDTO.builder()
                .idAnnonce(a.getIdAnnonce())
                .version(a.getVersion())
                .titre(a.getTitre())
                .description(a.getDescription())
                .prixMensuel(a.getPrixMensuel())
                .chargesMensuelles(a.getChargesMensuelles())
                .montantCaution(a.getMontantCaution())
                .surface(a.getSurface())
                .nombrePieces(a.getNombrePieces())
                .etage(a.getEtage())
                .modeLocation(a.getModeLocation())
                .typeLogement(a.getTypeLogement())
                .typeMeublage(a.getTypeMeublage())
                .dateDisponibiliteDebut(a.getDateDisponibiliteDebut())
                .dateDisponibiliteFin(a.getDateDisponibiliteFin())
                .etatAnnonce(a.getEtatAnnonce())
                .statutModeration(a.getStatutModeration())
                .dateCreation(a.getDateCreation())
                .dateModification(a.getDateModification())
                .photos(a.getPhotos() == null ? null :
                        a.getPhotos().stream().map(photoMapper::toDTO)
                        .collect(Collectors.toList()))
                .adresse(adresseMapper.toDTO(a.getAdresse()))
                .chambres(a.getChambres() == null ? null :
                        a.getChambres().stream().map(chambreMapper::toDTO)
                        .collect(Collectors.toList()))
                .proprietaireId(a.getProprietaire() != null ? a.getProprietaire().getId() : null)
                .build();
    }

    public AnnonceLocation toEntity(AnnonceLocationDTO dto) {
        if (dto == null) return null;
        return AnnonceLocation.builder()
                .idAnnonce(dto.getIdAnnonce())
                .version(dto.getVersion())
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .prixMensuel(dto.getPrixMensuel())
                .chargesMensuelles(dto.getChargesMensuelles())
                .montantCaution(dto.getMontantCaution())
                .surface(dto.getSurface())
                .nombrePieces(dto.getNombrePieces())
                .etage(dto.getEtage())
                .modeLocation(dto.getModeLocation())
                .typeLogement(dto.getTypeLogement())
                .typeMeublage(dto.getTypeMeublage())
                .dateDisponibiliteDebut(dto.getDateDisponibiliteDebut())
                .dateDisponibiliteFin(dto.getDateDisponibiliteFin())
                .etatAnnonce(dto.getEtatAnnonce())
                .statutModeration(dto.getStatutModeration())
                .photos(dto.getPhotos() == null ? null :
                        dto.getPhotos().stream().map(photoMapper::toEntity)
                        .collect(Collectors.toList()))
                .adresse(adresseMapper.toEntity(dto.getAdresse()))
                .chambres(dto.getChambres() == null ? null :
                        dto.getChambres().stream().map(chambreMapper::toEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}