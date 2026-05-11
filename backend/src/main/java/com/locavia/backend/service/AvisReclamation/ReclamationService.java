package com.locavia.backend.service.AvisReclamation;

import com.locavia.backend.dto.ReclamationDTO;

import java.util.List;
import java.util.Map;

public interface ReclamationService {

    List<ReclamationDTO> getAll();

    ReclamationDTO getById(Long id);

    ReclamationDTO create(ReclamationDTO dto);

    ReclamationDTO update(Long id, ReclamationDTO dto);

    void delete(Long id);

    Map<String, Object> getStats();
}
