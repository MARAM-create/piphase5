package com.locavia.backend.service;

import com.locavia.backend.dto.ChambreDTO;

import java.util.List;

public interface IChambreService {
    List<ChambreDTO> retrieveAllChambres();
    ChambreDTO retrieveChambre(Long id);
    ChambreDTO addChambre(ChambreDTO dto);
    void removeChambre(Long id);
    ChambreDTO modifyChambre(ChambreDTO dto);
}