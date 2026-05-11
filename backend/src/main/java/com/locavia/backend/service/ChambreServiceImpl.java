package com.locavia.backend.service;

import com.locavia.backend.dto.ChambreDTO;
import com.locavia.backend.mapper.ChambreMapper;
import com.locavia.backend.repository.ChambreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChambreServiceImpl implements IChambreService {

    private final ChambreRepository chambreRepository;
    private final ChambreMapper chambreMapper;

    @Override
    public List<ChambreDTO> retrieveAllChambres() {
        return chambreRepository.findAll()
                .stream().map(chambreMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    public ChambreDTO retrieveChambre(Long id) {
        return chambreMapper.toDTO(
                chambreRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Chambre introuvable : " + id))
        );
    }

    @Override
    public ChambreDTO addChambre(ChambreDTO dto) {
        return chambreMapper.toDTO(chambreRepository.save(chambreMapper.toEntity(dto)));
    }

    @Override
    public void removeChambre(Long id) {
        chambreRepository.deleteById(id);
    }

    @Override
    public ChambreDTO modifyChambre(ChambreDTO dto) {
        return chambreMapper.toDTO(chambreRepository.save(chambreMapper.toEntity(dto)));
    }
}