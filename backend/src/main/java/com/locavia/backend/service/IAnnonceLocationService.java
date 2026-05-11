package com.locavia.backend.service;

import com.locavia.backend.dto.AnnonceLocationDTO;
import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.enums.EtatAnnonce;

import java.util.List;

public interface IAnnonceLocationService {
    List<AnnonceLocationDTO> retrieveAllAnnonces();
    AnnonceLocationDTO retrieveAnnonce(Long id);
    void removeAnnonce(Long id);
    AnnonceLocationDTO modifyAnnonce(AnnonceLocationDTO dto);
    AnnonceLocationDTO addAnnonce(AnnonceLocationDTO dto, String email); // ← only this one
    List<AnnonceLocationDTO> getByProprietaire(String email);
    AnnonceLocationDTO updateEtat(Long id, String etat);

}