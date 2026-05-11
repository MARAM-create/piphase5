package com.locavia.backend.service;
import com.locavia.backend.repository.*;
import com.locavia.backend.dto.MessageDTO;
import com.locavia.backend.entity.Conversation;
import com.locavia.backend.entity.Message;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.time.LocalDateTime;
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final UtilisateurRepository utilisateurRepository;
    private final ConversationRepository conversationRepository;

    public Message envoyerMessage(Long conversationId, Long expediteurId, String contenu) {
        Conversation conversation = conversationService.getConversationById(conversationId);

        if (conversation.getEstActive() == null || !conversation.getEstActive()) {
            throw new RuntimeException("La conversation n'est pas encore active.");
        }

        Utilisateur expediteur = utilisateurRepository.findById(expediteurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur expéditeur non trouvé"));

        Utilisateur destinataire;

        if (conversation.getEtudiant() != null
                && expediteur.getId().equals(conversation.getEtudiant().getId())) {
            destinataire = conversation.getProprietaire();
        } else if (conversation.getProprietaire() != null
                && expediteur.getId().equals(conversation.getProprietaire().getId())) {
            destinataire = conversation.getEtudiant();
        } else {
            throw new RuntimeException("L'expéditeur n'appartient pas à cette conversation.");
        }

        if (destinataire == null) {
            throw new RuntimeException("Destinataire introuvable pour cette conversation.");
        }
        if (conversation.getBloque() != null && conversation.getBloque()) {
            throw new RuntimeException("Cette conversation est bloquée.");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setContenu(contenu);
        message.setDateEnvoi(LocalDateTime.now());
        message.setEstLu(false);

        return messageRepository.save(message);
    }

    public List<Message> getMessagesByConversation(Long conversationId) {
        return messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId);
    }

    public List<Message> getMessagesNonLus(Long conversationId) {
        return messageRepository.findByConversationIdAndEstLuFalse(conversationId);
    }

    public List<Message> getMessagesNonLusUtilisateur(Long utilisateurId) {
        return messageRepository.findByDestinataireIdAndEstLuFalse(utilisateurId);
    }

    public void marquerCommeLus(Long conversationId, Long utilisateurId) {
        List<Message> messages = messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId);

        for (Message message : messages) {
            if (message.getDestinataire() != null
                    && message.getDestinataire().getId().equals(utilisateurId)
                    && !Boolean.TRUE.equals(message.getEstLu())) {
                message.setEstLu(true);
                messageRepository.save(message);
            }
        }
    }
    public List<MessageDTO> getMessagesByConversationDTO(Long conversationId) {
        return messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private MessageDTO toDTO(Message m) {
        return new MessageDTO(
                m.getId(),
                m.getSupprime() != null && m.getSupprime()
                        ? "Ce message a été supprimé"
                        : m.getContenu(),
                m.getDateEnvoi(),
                m.getEstLu(),

                m.getExpediteur() != null ? m.getExpediteur().getId() : null,
                m.getExpediteur() != null ? m.getExpediteur().getNom() : null,
                m.getExpediteur() != null ? m.getExpediteur().getPrenom() : null,

                m.getDestinataire() != null ? m.getDestinataire().getId() : null,
                m.getDestinataire() != null ? m.getDestinataire().getNom() : null,
                m.getDestinataire() != null ? m.getDestinataire().getPrenom() : null,

                m.getTypeMessage(),

                m.getPieceJointeUrl(),
                m.getPieceJointeNom(),
                m.getPieceJointeType(),

                m.getSupprime(),
                m.getModifie(),
                m.getDateModification(),
                m.getReactionEmoji()
        );
    }


    public long countMessagesNonLusUtilisateur(Long utilisateurId) {
        return messageRepository.countByDestinataireIdAndEstLuFalse(utilisateurId);
    }

    public long countMessagesNonLusConversation(Long conversationId, Long utilisateurId) {
        return messageRepository.countByConversationIdAndDestinataireIdAndEstLuFalse(conversationId, utilisateurId);
    }


    public Message envoyerMessageAutomatiqueConfirmation(Long conversationId) {
        Conversation conversation = conversationService.getConversationById(conversationId);

        if (conversation.getDemandeLocation() == null) {
            throw new RuntimeException("Demande introuvable pour cette conversation.");
        }

        if (conversation.getEtudiant() == null) {
            throw new RuntimeException("Étudiant introuvable pour cette conversation.");
        }

        if (conversation.getProprietaire() == null) {
            throw new RuntimeException("Propriétaire introuvable pour cette conversation.");
        }

        String prenomEtudiant = conversation.getEtudiant().getPrenom() != null
                ? conversation.getEtudiant().getPrenom()
                : "Étudiant";

        String titreAnnonce = "votre annonce";
        if (conversation.getDemandeLocation().getAnnonce() != null
                && conversation.getDemandeLocation().getAnnonce().getTitre() != null) {
            titreAnnonce = conversation.getDemandeLocation().getAnnonce().getTitre();
        }

        String contenu = "Bonjour " + prenomEtudiant + ",\n\n"
                + "Votre demande de location pour l’annonce \"" + titreAnnonce + "\" a été acceptée par le propriétaire.\n"
                + "Vous pouvez désormais échanger directement via la messagerie Locavia pour discuter des prochains détails : visite, disponibilité, conditions et finalisation.\n\n"
                + "Cordialement,\n"
                + "L’équipe Locavia";

        Message message = new Message();
        message.setConversation(conversation);
        message.setExpediteur(conversation.getProprietaire());
        message.setDestinataire(conversation.getEtudiant());
        message.setContenu(contenu);
        message.setDateEnvoi(LocalDateTime.now());
        message.setEstLu(false);

        return messageRepository.save(message);
    }


    public Message envoyerMessageAvecPiece(
            Long conversationId,
            Long expediteurId,
            String contenu,
            MultipartFile fichier
    ) {
        Conversation conversation = conversationService.getConversationById(conversationId);
        if (!conversation.getEstActive()) {
            throw new RuntimeException("La conversation n'est pas encore active.");
        }

        Utilisateur expediteur = utilisateurRepository.findById(expediteurId)
                .orElseThrow(() -> new RuntimeException("Expéditeur introuvable"));

        Utilisateur destinataire;

        if (conversation.getEtudiant() != null
                && conversation.getEtudiant().getId().equals(expediteurId)) {
            destinataire = conversation.getProprietaire();
        } else {
            destinataire = conversation.getEtudiant();
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setContenu(contenu != null && !contenu.isBlank() ? contenu : "");
        message.setDateEnvoi(LocalDateTime.now());
        message.setEstLu(false);

        if (fichier != null && !fichier.isEmpty()) {
            try {
                String dossier = "uploads/messages";
                Files.createDirectories(Paths.get(dossier));

                String nomOriginal = fichier.getOriginalFilename();
                String extension = "";

                if (nomOriginal != null && nomOriginal.contains(".")) {
                    extension = nomOriginal.substring(nomOriginal.lastIndexOf("."));
                }

                String nomFichier = UUID.randomUUID() + extension;
                Path chemin = Paths.get(dossier, nomFichier);

                Files.write(chemin, fichier.getBytes());

                String url = "http://localhost:8080/uploads/messages/" + nomFichier;

                message.setPieceJointeUrl(url);
                message.setPieceJointeNom(nomOriginal);

                String contentType = fichier.getContentType();

                if (contentType != null && contentType.startsWith("image/")) {
                    message.setPieceJointeType("IMAGE");
                } else {
                    message.setPieceJointeType("FICHIER");
                }

            } catch (Exception e) {
                throw new RuntimeException("Erreur lors de l'enregistrement du fichier.");
            }
        }

        return messageRepository.save(message);
    }

    public void creerMessageAppelSysteme(
            Long conversationId,
            Long expediteurId,
            Long destinataireId,
            String contenu
    ) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation introuvable"));

        Utilisateur expediteur = utilisateurRepository.findById(expediteurId)
                .orElse(null);

        Utilisateur destinataire = utilisateurRepository.findById(destinataireId)
                .orElse(null);

        Message message = new Message();
        message.setConversation(conversation);
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setContenu(contenu);
        message.setDateEnvoi(LocalDateTime.now());
        message.setEstLu(false);
        message.setTypeMessage("SYSTEME");

        messageRepository.save(message);
    }


    public MessageDTO modifierMessage(Long messageId, Long utilisateurId, String nouveauContenu) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        if (message.getExpediteur() == null || !message.getExpediteur().getId().equals(utilisateurId)) {
            throw new RuntimeException("Vous ne pouvez modifier que vos propres messages.");
        }

        if (message.getSupprime() != null && message.getSupprime()) {
            throw new RuntimeException("Impossible de modifier un message supprimé.");
        }

        if (message.getPieceJointeUrl() != null) {
            throw new RuntimeException("Impossible de modifier un message avec pièce jointe.");
        }

        if (message.getTypeMessage() != null && "SYSTEME".equals(message.getTypeMessage())) {
            throw new RuntimeException("Impossible de modifier un message système.");
        }

        message.setContenu(nouveauContenu);
        message.setModifie(true);
        message.setDateModification(LocalDateTime.now());

        return toDTO(messageRepository.save(message));
    }

    public void supprimerMessage(Long messageId, Long utilisateurId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        if (message.getExpediteur() == null || !message.getExpediteur().getId().equals(utilisateurId)) {
            throw new RuntimeException("Vous ne pouvez supprimer que vos propres messages.");
        }

        if (message.getTypeMessage() != null && "SYSTEME".equals(message.getTypeMessage())) {
            throw new RuntimeException("Impossible de supprimer un message système.");
        }

        message.setSupprime(true);
        message.setContenu("Ce message a été supprimé");
        message.setPieceJointeUrl(null);
        message.setPieceJointeNom(null);
        message.setPieceJointeType(null);
        message.setDateModification(LocalDateTime.now());

        messageRepository.save(message);
    }
    public MessageDTO reagirMessage(Long messageId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        if (message.getSupprime() != null && message.getSupprime()) {
            throw new RuntimeException("Impossible de réagir à un message supprimé.");
        }

        message.setReactionEmoji(emoji);

        return toDTO(messageRepository.save(message));
    }
    public MessageDTO retirerReaction(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        message.setReactionEmoji(null);

        return toDTO(messageRepository.save(message));
    }
}
