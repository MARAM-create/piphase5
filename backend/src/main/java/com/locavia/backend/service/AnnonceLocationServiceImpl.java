package com.locavia.backend.service;

import com.locavia.backend.dto.AnnonceLocationDTO;
import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.EtatAnnonce;
import com.locavia.backend.mapper.AnnonceLocationMapper;
import com.locavia.backend.repository.AnnonceLocationRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.locavia.backend.enums.EtatAnnonce; // ← adjust to your actual package

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AnnonceLocationServiceImpl implements IAnnonceLocationService {
    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceLocationRepository annonceRepository;
    private final AnnonceLocationMapper annonceMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AnnonceLocationDTO> retrieveAllAnnonces() {
        return annonceRepository.findAll()
                .stream().map(annonceMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AnnonceLocationDTO retrieveAnnonce(Long id) {
        return annonceMapper.toDTO(
                annonceRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Annonce introuvable : " + id))
        );
    }

    @Override
    @Transactional
    public AnnonceLocationDTO addAnnonce(AnnonceLocationDTO dto, String email) {
        Utilisateur proprietaire = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        AnnonceLocation entity = annonceMapper.toEntity(dto);

        //  NETTOYER LES IDS POUR LES NOUVELLES CRÉATIONS
        entity.setIdAnnonce(null);
        entity.setVersion(null);
        entity.setProprietaire(proprietaire);        //  ENLEVER LES IDS DES PHOTOS AU NIVEAU ANNONCE
        if (entity.getPhotos() != null) {
            entity.getPhotos().forEach(photo -> {
                photo.setId(null);
                photo.setAnnonce(entity);  // Définir la relation
                photo.setChambre(null);
            });
        }

        //  ENLEVER LES IDS DES CHAMBRES ET LEURS PHOTOS
        if (entity.getChambres() != null) {
            entity.getChambres().forEach(chambre -> {
                chambre.setIdChambre(null);
                chambre.setAnnonce(entity);  // Définir la relation

                if (chambre.getPhotos() != null) {
                    chambre.getPhotos().forEach(photo -> {
                        photo.setId(null);
                        photo.setChambre(chambre);  // Définir la relation
                        photo.setAnnonce(null);
                    });
                }
            });
        }
        //  LOG
        System.out.println("📸 Annonce photos: " + (entity.getPhotos() != null ? entity.getPhotos().size() : 0));
        if (entity.getChambres() != null) {
            entity.getChambres().forEach(c ->
                    System.out.println("🛏️ Chambre " + c.getIdChambre() + " photos: " + (c.getPhotos() != null ? c.getPhotos().size() : 0))
            );
        }
        AnnonceLocation saved = annonceRepository.save(entity);
        return annonceMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public void removeAnnonce(Long id) {
        annonceRepository.deleteById(id);
    }

    @Override
    @Transactional
    public AnnonceLocationDTO modifyAnnonce(AnnonceLocationDTO dto) {
        if (dto.getIdAnnonce() == null || dto.getIdAnnonce() <= 0) {
            throw new IllegalArgumentException("ID requis pour la mise à jour");
        }

        // Fetch existing to preserve proprietaire + version
        AnnonceLocation existing = annonceRepository.findById(dto.getIdAnnonce())
                .orElseThrow(() -> new RuntimeException("Annonce introuvable : " + dto.getIdAnnonce()));

        AnnonceLocation entity = annonceMapper.toEntity(dto);
        entity.setProprietaire(existing.getProprietaire());  // ← without this, proprietaire becomes null → NOT NULL constraint → 500
        entity.setVersion(existing.getVersion());             // ← without this, optimistic lock fails

        if (entity.getPhotos() != null) {
            entity.getPhotos().forEach(photo -> photo.setAnnonce(entity));
        }

        if (entity.getChambres() != null) {
            entity.getChambres().forEach(chambre -> {
                chambre.setAnnonce(entity);
                if (chambre.getPhotos() != null) {
                    chambre.getPhotos().forEach(photo -> photo.setChambre(chambre));
                }
            });
        }

        return annonceMapper.toDTO(annonceRepository.save(entity));
    }
    @Override
    @Transactional
    public AnnonceLocationDTO updateEtat(Long id, String etat) {
        AnnonceLocation existing = annonceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Annonce introuvable : " + id));

        existing.setEtatAnnonce(EtatAnnonce.valueOf(etat)); // ← update only the state field

        return annonceMapper.toDTO(annonceRepository.save(existing));
    }
    @Override
    @Transactional(readOnly = true)
    public List<AnnonceLocationDTO> getByProprietaire(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return annonceRepository.findByProprietaire(user)
                .stream().map(annonceMapper::toDTO).collect(Collectors.toList());
    }
}