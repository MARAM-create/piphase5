package com.locavia.backend.service.AvisReclamation.impl;

import com.locavia.backend.dto.ReclamationDTO;
import com.locavia.backend.entity.Reclamation;
import com.locavia.backend.enums.ReclamationPriority;
import com.locavia.backend.enums.ReclamationStatus;
import com.locavia.backend.exception.ResourceNotFoundException;
import com.locavia.backend.mapper.ReclamationMapper;
import com.locavia.backend.repository.ReclamationRepository;
import com.locavia.backend.service.AvisReclamation.AIService;
import com.locavia.backend.service.AvisReclamation.EmailService;
import com.locavia.backend.service.AvisReclamation.ReclamationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ReclamationServiceImpl implements ReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final ReclamationMapper reclamationMapper;
    private final AIService aiService;
    private final EmailService emailService;

    @Override
    @Transactional(readOnly = true)
    public List<ReclamationDTO> getAll() {
        return reclamationRepository.findAll()
                .stream()
                .map(reclamationMapper::toDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReclamationDTO getById(Long id) {
        Reclamation reclamation = reclamationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reclamation", id));
        return reclamationMapper.toDTO(reclamation);
    }

    @Override
    public ReclamationDTO create(ReclamationDTO dto) {
        Reclamation reclamation = reclamationMapper.toEntity(dto);

        if (reclamation.getStatus() == null) {
            reclamation.setStatus(ReclamationStatus.PENDING);
        }

        // AI: Auto-classify and detect priority from description
        String text = reclamation.getDescription() != null ? reclamation.getDescription() : reclamation.getTitre();
        if (text != null && !text.isBlank()) {
            String category = aiService.classifyReclamation(text);
            reclamation.setCategory(category);

            ReclamationPriority priority = aiService.detectPriority(text);
            reclamation.setPriority(priority);
        }

        if (reclamation.getPriority() == null) {
            reclamation.setPriority(ReclamationPriority.LOW);
        }

        Reclamation saved = reclamationRepository.save(reclamation);

        // Send confirmation email if email provided
        if (saved.getEmail() != null && !saved.getEmail().isBlank()) {
            emailService.sendReclamationConfirmation(
                saved.getEmail(),
                saved.getId(),
                saved.getTitre(),
                saved.getPriority() != null ? saved.getPriority().name() : "LOW"
            );
        }

        return reclamationMapper.toDTO(saved);
    }

    @Override
    public ReclamationDTO update(Long id, ReclamationDTO dto) {
        Reclamation reclamation = reclamationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reclamation", id));

        ReclamationStatus oldStatus = reclamation.getStatus();
        reclamationMapper.updateEntity(reclamation, dto);

        // If status changed to RESOLVED, set resolvedAt and send email
        if (reclamation.getStatus() == ReclamationStatus.RESOLVED && oldStatus != ReclamationStatus.RESOLVED) {
            reclamation.setResolvedAt(LocalDateTime.now());
            if (reclamation.getEmail() != null && !reclamation.getEmail().isBlank()) {
                emailService.sendReclamationResolved(
                    reclamation.getEmail(),
                    reclamation.getId(),
                    reclamation.getTitre()
                );
            }
        }

        Reclamation updated = reclamationRepository.save(reclamation);
        return reclamationMapper.toDTO(updated);
    }

    @Override
    public void delete(Long id) {
        if (!reclamationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reclamation", id);
        }
        reclamationRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("total", reclamationRepository.count());

        // Status distribution
        Map<String, Long> statusDist = new HashMap<>();
        for (Object[] row : reclamationRepository.getStatusDistribution()) {
            statusDist.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("statusDistribution", statusDist);

        // Priority distribution
        Map<String, Long> priorityDist = new HashMap<>();
        for (Object[] row : reclamationRepository.getPriorityDistribution()) {
            priorityDist.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("priorityDistribution", priorityDist);

        // Category distribution
        Map<String, Long> categoryDist = new HashMap<>();
        for (Object[] row : reclamationRepository.getCategoryDistribution()) {
            categoryDist.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("categoryDistribution", categoryDist);

        return stats;
    }
}
