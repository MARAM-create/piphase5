package com.locavia.backend.controller;
import com.locavia.backend.dto.AppelMessageDTO;
import com.locavia.backend.entity.Conversation;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.repository.UtilisateurRepository;
import com.locavia.backend.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import com.locavia.backend.service.MessageService;
@Controller
@RequiredArgsConstructor
public class AppelWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationService conversationService;
    private final UtilisateurRepository utilisateurRepository;
    private final MessageService messageService;
    @MessageMapping("/appel/demarrer")
    public void demarrerAppel(AppelMessageDTO dto) {
        Conversation conversation = conversationService.getConversationById(dto.getConversationId());

        if (conversation.getEstActive() == null || !conversation.getEstActive()) {
            return;
        }

        Utilisateur appelant = utilisateurRepository.findById(dto.getAppelantId())
                .orElse(null);

        if (appelant == null) {
            return;
        }

        Utilisateur destinataire = determinerDestinataire(conversation, appelant.getId());

        if (destinataire == null) {
            return;
        }

        String roomName = "Locavia-Audio-Conversation-" + conversation.getId();

        AppelMessageDTO message = new AppelMessageDTO();
        message.setType("APPEL_ENTRANT");
        message.setConversationId(conversation.getId());

        message.setAppelantId(appelant.getId());
        message.setAppelantNom(appelant.getNom());
        message.setAppelantPrenom(appelant.getPrenom());

        message.setDestinataireId(destinataire.getId());
        message.setDestinataireNom(destinataire.getNom());
        message.setDestinatairePrenom(destinataire.getPrenom());

        message.setRoomName(roomName);
        message.setMessage("Appel vocal entrant");

        envoyerAuUtilisateur(destinataire.getId(), message);
    }

    @MessageMapping("/appel/accepter")
    public void accepterAppel(AppelMessageDTO dto) {
        AppelMessageDTO message = new AppelMessageDTO();
        message.setType("APPEL_ACCEPTE");
        message.setConversationId(dto.getConversationId());
        message.setAppelantId(dto.getAppelantId());
        message.setDestinataireId(dto.getDestinataireId());
        message.setRoomName(dto.getRoomName());
        message.setMessage("Appel accepté");

        // On notifie l'appelant
        envoyerAuUtilisateur(dto.getAppelantId(), message);

        // On notifie aussi celui qui accepte
        envoyerAuUtilisateur(dto.getDestinataireId(), message);
    }

    @MessageMapping("/appel/terminer")
    public void terminerAppel(AppelMessageDTO dto) {
        String contenuMessage = "APPEL_VOCAL_TERMINE";

        if ("APPEL_VOCAL_MANQUE".equals(dto.getMessage())) {
            contenuMessage = "APPEL_VOCAL_MANQUE";
        }

        messageService.creerMessageAppelSysteme(
                dto.getConversationId(),
                dto.getAppelantId(),
                dto.getDestinataireId(),
                contenuMessage
        );

        AppelMessageDTO message = new AppelMessageDTO();
        message.setType("APPEL_TERMINE");
        message.setConversationId(dto.getConversationId());
        message.setAppelantId(dto.getAppelantId());
        message.setDestinataireId(dto.getDestinataireId());
        message.setRoomName(dto.getRoomName());
        message.setMessage("Appel terminé");

        if (dto.getAppelantId() != null) {
            envoyerAuUtilisateur(dto.getAppelantId(), message);
        }

        if (dto.getDestinataireId() != null) {
            envoyerAuUtilisateur(dto.getDestinataireId(), message);
        }
    }
    private Utilisateur determinerDestinataire(Conversation conversation, Long appelantId) {
        if (conversation.getEtudiant() != null
                && conversation.getEtudiant().getId().equals(appelantId)) {
            return conversation.getProprietaire();
        }

        if (conversation.getProprietaire() != null
                && conversation.getProprietaire().getId().equals(appelantId)) {
            return conversation.getEtudiant();
        }

        return null;
    }

    private void envoyerAuUtilisateur(Long utilisateurId, AppelMessageDTO message) {
        messagingTemplate.convertAndSend(
                "/topic/appels/" + utilisateurId,
                message
        );
    }

    @MessageMapping("/appel/refuser")
    public void refuserAppel(AppelMessageDTO dto) {
        AppelMessageDTO message = new AppelMessageDTO();
        message.setType("APPEL_REFUSE");
        message.setConversationId(dto.getConversationId());
        message.setAppelantId(dto.getAppelantId());
        message.setDestinataireId(dto.getDestinataireId());
        message.setRoomName(dto.getRoomName());
        message.setMessage("Appel refusé");

        messageService.creerMessageAppelSysteme(
                dto.getConversationId(),
                dto.getAppelantId(),
                dto.getDestinataireId(),
                "APPEL_VOCAL_MANQUE"
        );

        envoyerAuUtilisateur(dto.getAppelantId(), message);
    }
}
