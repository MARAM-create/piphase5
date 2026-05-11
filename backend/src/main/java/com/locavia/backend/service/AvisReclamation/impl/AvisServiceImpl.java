package com.locavia.backend.service.AvisReclamation.impl;

import com.locavia.backend.dto.AvisDTO;
import com.locavia.backend.entity.Avis;
import com.locavia.backend.enums.SentimentType;
import com.locavia.backend.exception.ResourceNotFoundException;
import com.locavia.backend.mapper.AvisMapper;
import com.locavia.backend.repository.AvisRepository;

import com.locavia.backend.service.AvisReclamation.AIService;
import com.locavia.backend.service.AvisReclamation.AvisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AvisServiceImpl implements AvisService {

    private final AvisRepository avisRepository;
    private final AvisMapper avisMapper;
    private final AIService aiService;

    @Override
    @Transactional(readOnly = true)
    public List<AvisDTO> getAll() {
        return avisRepository.findAll()
                .stream()
                .map(avisMapper::toDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AvisDTO getById(Long id) {
        Avis avis = avisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis", id));
        return avisMapper.toDTO(avis);
    }

    @Override
    public AvisDTO create(AvisDTO dto) {
        Avis avis = avisMapper.toEntity(dto);

        // AI: Analyze sentiment from the comment
        if (avis.getCommentaire() != null && !avis.getCommentaire().isBlank()) {
            SentimentType sentiment = aiService.analyzeSentiment(avis.getCommentaire());
            avis.setSentiment(sentiment);
        }

        if (avis.getTrusted() == null) {
            avis.setTrusted(true);
        }

        Avis saved = avisRepository.save(avis);
        return avisMapper.toDTO(saved);
    }

    @Override
    public AvisDTO update(Long id, AvisDTO dto) {
        Avis avis = avisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis", id));
        avisMapper.updateEntity(avis, dto);

        // Re-analyze sentiment on update
        if (avis.getCommentaire() != null && !avis.getCommentaire().isBlank()) {
            SentimentType sentiment = aiService.analyzeSentiment(avis.getCommentaire());
            avis.setSentiment(sentiment);
        }

        Avis updated = avisRepository.save(avis);
        return avisMapper.toDTO(updated);
    }

    @Override
    public void delete(Long id) {
        if (!avisRepository.existsById(id)) {
            throw new ResourceNotFoundException("Avis", id);
        }
        avisRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        Double avgRating = avisRepository.getAverageRating();
        stats.put("averageRating", avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 0);
        stats.put("totalReviews", avisRepository.count());

        // Sentiment distribution
        Map<String, Long> sentimentDist = new HashMap<>();
        for (Object[] row : avisRepository.getSentimentDistribution()) {
            sentimentDist.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("sentimentDistribution", sentimentDist);

        return stats;
    }
}
