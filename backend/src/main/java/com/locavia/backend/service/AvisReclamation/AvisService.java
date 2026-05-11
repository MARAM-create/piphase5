package com.locavia.backend.service.AvisReclamation;

import com.locavia.backend.dto.AvisDTO;

import java.util.List;
import java.util.Map;

public interface AvisService {

    List<AvisDTO> getAll();

    AvisDTO getById(Long id);

    AvisDTO create(AvisDTO dto);

    AvisDTO update(Long id, AvisDTO dto);

    void delete(Long id);

    Map<String, Object> getStats();
}
