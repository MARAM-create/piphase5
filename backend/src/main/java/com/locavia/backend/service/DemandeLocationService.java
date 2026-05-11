package com.locavia.backend.service;

import com.locavia.backend.dto.DemandeLocationDTO;
import com.locavia.backend.dto.DemandeRecueProprietaireDTO;
import com.locavia.backend.entity.Conversation;
import com.locavia.backend.entity.DemandeLocation;
import com.locavia.backend.entity.Visite;
import com.locavia.backend.enums.ModeVisite;
import com.locavia.backend.enums.StatutDemande;
import com.locavia.backend.repository.DemandeLocationRepository;
import com.locavia.backend.repository.VisiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
public class DemandeLocationService {

    private final DemandeLocationRepository demandeLocationRepository;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final PdfService pdfService ;
    private final VisiteRepository visiteRepository;
    private final MailNotificationService mailNotificationService;

    public DemandeLocation creerDemande(DemandeLocation demande) {
        Long etudiantId = demande.getEtudiant().getId();
        Long annonceId = demande.getAnnonce().getIdAnnonce();

        boolean existeDeja = demandeLocationRepository
                .existsByEtudiantIdAndAnnonceIdAnnonce(etudiantId, annonceId);

        if (existeDeja) {
            throw new RuntimeException("Vous avez déjà envoyé une demande pour cette annonce.");
        }

        demande.setDateDemande(LocalDateTime.now());
        demande.setStatutDemande(StatutDemande.EN_ATTENTE);
        demande.setArchive(false);
        demande.setSupprime(false);

        DemandeLocation saved = demandeLocationRepository.save(demande);

        conversationService.creerConversation(saved.getIdDemande());

        mailNotificationService.notifierNouvelleDemande(saved);

        return saved;
    }

    public DemandeLocation getDemandeById(Long id) {
        return demandeLocationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
    }

    public List<DemandeLocation> getDemandesByEtudiant(Long etudiantId) {
        return demandeLocationRepository.findByEtudiantIdAndArchiveFalseAndSupprimeFalse(etudiantId);
    }

    public List<DemandeLocation> getDemandesByAnnonce(Long annonceId) {
        return demandeLocationRepository.findByAnnonceId(annonceId);
    }



    public DemandeLocation getDerniereDemandeEtudiant(Long etudiantId) {
        return demandeLocationRepository
                .findDerniereDemandeByEtudiant(etudiantId)
                .stream().findFirst().orElse(null);
    }




    public DemandeLocation changerStatut(Long id, StatutDemande statut) {
        DemandeLocation demande = getDemandeById(id);

        System.out.println(">>> changerStatut appelé");
        System.out.println(">>> demande id = " + id);
        System.out.println(">>> ancien statut = " + demande.getStatutDemande());
        System.out.println(">>> nouveau statut reçu = " + statut);

        StatutDemande ancienStatut = demande.getStatutDemande();
        demande.setStatutDemande(statut);

        DemandeLocation saved = demandeLocationRepository.save(demande);

        if (statut == StatutDemande.ACCEPTEE && ancienStatut != StatutDemande.ACCEPTEE) {
            System.out.println(">>> branche ACCEPTEE exécutée");

            conversationService.activerConversation(saved.getIdDemande());
            System.out.println(">>> conversation activée pour demande = " + saved.getIdDemande());

            Conversation conversation = conversationService.getConversationByDemande(saved.getIdDemande());
            System.out.println(">>> conversation trouvée = " + conversation.getId());

            messageService.envoyerMessageAutomatiqueConfirmation(conversation.getId());
            System.out.println(">>> message automatique envoyé");
        }

        return saved;

    }

    public List<DemandeLocation> getDemandesActivesByEtudiant(Long etudiantId) {
        return demandeLocationRepository.findByEtudiantIdAndArchiveFalse(etudiantId);
    }

    public List<DemandeLocation> getDemandesArchiveesByEtudiant(Long etudiantId) {
        return demandeLocationRepository.findByEtudiantIdAndArchiveTrue(etudiantId);
    }

    public DemandeLocation archiverDemande(Long demandeId, Long etudiantId) {
        DemandeLocation demande = getDemandeById(demandeId);

        if (!demande.getEtudiant().getId().equals(etudiantId)) {
            throw new RuntimeException("Vous ne pouvez pas archiver cette demande.");
        }

        demande.setArchive(true);
        return demandeLocationRepository.save(demande);
    }

    public DemandeLocation supprimerDemande(Long demandeId, Long etudiantId) {
        DemandeLocation demande = getDemandeById(demandeId);

        if (!demande.getEtudiant().getId().equals(etudiantId)) {
            throw new RuntimeException("Vous ne pouvez pas supprimer cette demande.");
        }

        demande.setSupprime(true);
        return demandeLocationRepository.save(demande);
    }

    @Transactional(readOnly = true)
    public List<DemandeLocationDTO> getDemandesDTOByEtudiant(Long etudiantId) {
        return demandeLocationRepository.findByEtudiantIdAndArchiveFalseAndSupprimeFalse(etudiantId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DemandeLocationDTO> getDemandesArchiveesDTOByEtudiant(Long etudiantId) {
        return demandeLocationRepository.findByEtudiantIdAndArchiveTrueAndSupprimeFalse(etudiantId)
                .stream()
                .map(this::toDTO)
                .toList();
    }



    private DemandeLocationDTO toDTO(DemandeLocation d) {
        String annonceAdresse = null;
        String annonceVille = null;
        Long conversationId = null;

        if (d.getAnnonce() != null && d.getAnnonce().getAdresse() != null) {
            var adr = d.getAnnonce().getAdresse();

            if (adr.getRue() != null && adr.getVille() != null) {
                annonceAdresse = adr.getRue() + ", " + adr.getVille();
            } else if (adr.getRue() != null) {
                annonceAdresse = adr.getRue();
            } else if (adr.getVille() != null) {
                annonceAdresse = adr.getVille();
            }

            annonceVille = adr.getVille();
        }

        try {
            Conversation conversation = conversationService.getConversationByDemande(d.getIdDemande());
            conversationId = conversation.getId();
        } catch (Exception ignored) {
        }

        return new DemandeLocationDTO(
                d.getIdDemande(),
                d.getDateDemande(),
                d.getMessageCandidat(),
                d.getStatutDemande() != null ? d.getStatutDemande().name() : null,
                d.getNombrePersonnes(),
                d.getArchive(),
                d.getAnnonce() != null ? d.getAnnonce().getIdAnnonce() : null,
                d.getAnnonce() != null ? d.getAnnonce().getTitre() : null,
                annonceAdresse,
                annonceVille,
                conversationId
        );
    }


    public DemandeLocation desarchiverDemande(Long demandeId, Long etudiantId) {
        DemandeLocation demande = getDemandeById(demandeId);

        if (!demande.getEtudiant().getId().equals(etudiantId)) {
            throw new RuntimeException("Vous ne pouvez pas désarchiver cette demande.");
        }

        demande.setArchive(false);
        return demandeLocationRepository.save(demande);
    }


    public byte[] genererPdfDemande(Long demandeId) {
        try {
            DemandeLocation demande = getDemandeById(demandeId);
            return pdfService.genererPdfDemande(demande);
        } catch (com.itextpdf.text.DocumentException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF de la demande.", e);
        }
    }

    @Transactional(readOnly = true)
    public List<DemandeRecueProprietaireDTO> getDemandesRecuesDTOByProprietaire(Long proprietaireId) {
        return demandeLocationRepository
                .findByAnnonceProprietaireIdAndSupprimeFalse(proprietaireId)
                .stream()
                .map(this::toDemandeRecueProprietaireDTO)
                .toList();
    }


    private DemandeRecueProprietaireDTO toDemandeRecueProprietaireDTO(DemandeLocation d) {
        String annonceAdresse = null;
        String annonceVille = null;
        List<Visite> visites = visiteRepository.findAllByDemandeIdDemande(d.getIdDemande());

        String statutDirect = null;
        String statutVideo = null;
        boolean directCree = false;
        boolean videoCree = false;

        for (Visite v : visites) {
            if (v.getModeVisite() == ModeVisite.DIRECT) {
                directCree = true;
                statutDirect = v.getStatutVisite() != null ? v.getStatutVisite().name() : null;
            }
            if (v.getModeVisite() == ModeVisite.VIDEO) {
                videoCree = true;
                statutVideo = v.getStatutVisite() != null ? v.getStatutVisite().name() : null;
            }
        }
        if (d.getAnnonce() != null && d.getAnnonce().getAdresse() != null) {
            var adr = d.getAnnonce().getAdresse();

            if (adr.getRue() != null && adr.getVille() != null) {
                annonceAdresse = adr.getRue() + ", " + adr.getVille();
            } else if (adr.getRue() != null) {
                annonceAdresse = adr.getRue();
            } else if (adr.getVille() != null) {
                annonceAdresse = adr.getVille();
            }

            annonceVille = adr.getVille();
        }

        return new DemandeRecueProprietaireDTO(
                d.getIdDemande(),
                d.getDateDemande(),
                d.getStatutDemande() != null ? d.getStatutDemande().name() : null,

                d.getEtudiant() != null ? d.getEtudiant().getId() : null,
                d.getEtudiant() != null ? d.getEtudiant().getPrenom() : null,
                d.getEtudiant() != null ? d.getEtudiant().getNom() : null,
                d.getEtudiant() != null ? d.getEtudiant().getEmail() : null,
                d.getEtudiant() != null ? d.getEtudiant().getTelephone() : null,

                d.getAnnonce() != null ? d.getAnnonce().getIdAnnonce() : null,
                d.getAnnonce() != null ? d.getAnnonce().getTitre() : null,
                annonceAdresse,
                annonceVille,

                d.getNombrePersonnes(),
                d.getDateEntree(),
                d.getDureeLocation(),
                d.getBudget(),
                d.getVilleActuelle(),
                d.getCriterePrincipal(),
                d.getBesoinPrincipal(),
                d.getRemarqueLogement(),

                d.getTypeVisite() != null ? d.getTypeVisite().name() : null,
                d.getFormatVisite() != null ? d.getFormatVisite().name() : null,
                d.getMomentVisite(),

                d.getDateSouhaitee(),
                d.getJoursDisponibles(),
                d.getPlageHoraire(),
                d.getRemarqueDisponibilite(),

                d.getMessageCandidat(),


                statutDirect,
                statutVideo,
                directCree,
                videoCree,

                d.getArchive(),
                d.getSupprime()
        );
    } }
