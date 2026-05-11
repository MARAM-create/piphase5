package com.locavia.backend.service;

import com.locavia.backend.dto.ConversationResumeDTO;
import com.locavia.backend.entity.Conversation;
import com.locavia.backend.entity.DemandeLocation;
import com.locavia.backend.entity.Photo;
import com.locavia.backend.repository.ConversationRepository;
import com.locavia.backend.repository.DemandeLocationRepository;
import com.locavia.backend.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.locavia.backend.entity.Message;
import com.locavia.backend.repository.MessageRepository;
import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import com.locavia.backend.entity.Photo;
@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final DemandeLocationRepository demandeLocationRepository;
    private final MessageRepository messageRepository;
    public Conversation creerConversation(Long demandeLocationId) {
        DemandeLocation demande = demandeLocationRepository.findById(demandeLocationId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        Conversation conversation = new Conversation();
        conversation.setDateCreation(LocalDateTime.now());
        conversation.setDemandeLocation(demande);
        conversation.setEtudiant(demande.getEtudiant());
        conversation.setProprietaire(demande.getAnnonce().getProprietaire());
        conversation.setEstActive(false);

        return conversationRepository.save(conversation);
    }

    public Conversation getConversationByDemande(Long demandeLocationId) {
        return conversationRepository.findByDemandeLocationIdDemande(demandeLocationId)
                .orElseThrow(() -> new RuntimeException("Conversation non trouvée"));
    }

    public Conversation getConversationById(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation non trouvée"));
    }
    @Transactional(readOnly = true)
    public List<ConversationResumeDTO> getConversationsEtudiantDTO(Long etudiantId) {
        return conversationRepository.findByEtudiantId(etudiantId)
                .stream()
                .map(this::toResumeDTO)
                .sorted(Comparator.comparing(
                        ConversationResumeDTO::getDateDernierMessage,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }
    @Transactional(readOnly = true)
    public List<ConversationResumeDTO> getConversationsProprietaireDTO(Long proprietaireId) {
        return conversationRepository.findByProprietaireId(proprietaireId)
                .stream()
                .map(this::toResumeDTO)
                .sorted(Comparator.comparing(
                        ConversationResumeDTO::getDateDernierMessage,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    public void activerConversation(Long demandeId) {
        Conversation conversation = getConversationByDemande(demandeId);
        conversation.setEstActive(true);
        conversationRepository.save(conversation);
    }

    private ConversationResumeDTO toResumeDTO(Conversation c) {
        ConversationResumeDTO dto = new ConversationResumeDTO();

        dto.setId(c.getId());
        dto.setEstActive(c.getEstActive());
        dto.setBloque(c.getBloque());
        dto.setBloqueParId(c.getBloqueParId());
        if (c.getDemandeLocation() != null) {
            dto.setDemandeId(c.getDemandeLocation().getIdDemande());
            dto.setStatutDemande(
                    c.getDemandeLocation().getStatutDemande() != null
                            ? c.getDemandeLocation().getStatutDemande().name()
                            : null
            );

            if (c.getDemandeLocation().getAnnonce() != null) {
                var annonce = c.getDemandeLocation().getAnnonce();

                dto.setTitreAnnonce(annonce.getTitre());
                dto.setAnnonceId(annonce.getIdAnnonce());

                if (annonce.getPhotos() != null && !annonce.getPhotos().isEmpty()) {
                    Photo premierePhoto = annonce.getPhotos().get(0);

                    dto.setAnnonceImageUrl(premierePhoto.getUrl());
                }
            }
        }

        if (c.getEtudiant() != null) {
            dto.setEtudiantId(c.getEtudiant().getId());
            dto.setEtudiantNom(c.getEtudiant().getNom());
            dto.setEtudiantPrenom(c.getEtudiant().getPrenom());
            dto.setEtudiantPhotoProfil(c.getEtudiant().getPhotoProfil());
        }

        if (c.getProprietaire() != null) {
            dto.setProprietaireId(c.getProprietaire().getId());
            dto.setProprietaireNom(c.getProprietaire().getNom());
            dto.setProprietairePrenom(c.getProprietaire().getPrenom());
            dto.setProprietairePhotoProfil(c.getProprietaire().getPhotoProfil());
        }

        Message dernier = messageRepository.findTopByConversationIdOrderByDateEnvoiDesc(c.getId());

        if (dernier != null) {
            dto.setDateDernierMessage(dernier.getDateEnvoi());

            if (dernier.getPieceJointeType() != null) {
                if ("IMAGE".equals(dernier.getPieceJointeType())) {
                    dto.setDernierMessage("📷 Image");
                } else {
                    dto.setDernierMessage("📎 " + (dernier.getPieceJointeNom() != null ? dernier.getPieceJointeNom() : "Fichier"));
                }
            } else {
                dto.setDernierMessage(dernier.getContenu());
            }
        } else {
            dto.setDernierMessage("Aucun message pour le moment");
            dto.setDateDernierMessage(c.getDateCreation());
        }

        return dto;
    }

    public ConversationResumeDTO bloquerConversation(Long conversationId, Long utilisateurId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation introuvable"));

        conversation.setBloque(true);
        conversation.setBloqueParId(utilisateurId);

        return toResumeDTO(conversationRepository.save(conversation));
    }

    public ConversationResumeDTO debloquerConversation(Long conversationId, Long utilisateurId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation introuvable"));

        if (conversation.getBloqueParId() != null && !conversation.getBloqueParId().equals(utilisateurId)) {
            throw new RuntimeException("Seul l’utilisateur qui a bloqué peut débloquer cette conversation.");
        }

        conversation.setBloque(false);
        conversation.setBloqueParId(null);

        return toResumeDTO(conversationRepository.save(conversation));
    }
}
