package com.locavia.backend.service;

import com.locavia.backend.dto.MeubleRequestDTO;
import com.locavia.backend.dto.MeubleResponseDTO;
import com.locavia.backend.dto.ProfilPrestataireResponseDTO;
import com.locavia.backend.entity.Meuble;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.StatutMeuble;
import com.locavia.backend.repository.MeubleRepository;
import com.locavia.backend.repository.ProfilPrestataireRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MeubleService {

    private final MeubleRepository            meubleRepository;
    private final UtilisateurRepository       utilisateurRepository;
    private final ProfilPrestataireRepository profilPrestataireRepository;
    private final ServiceEmail serviceEmail;
    private final ServicePdf   servicePdf;
    @Value("${app.upload.dir:uploads/meubles}")
    private String uploadDir;

    private Utilisateur getUtilisateurConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // ─── Prestataires déménagement ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProfilPrestataireResponseDTO> getPrestatairesDemo() {
        return profilPrestataireRepository.findAll().stream()
                .filter(p -> p.getSpecialite() != null &&
                        p.getSpecialite().toLowerCase()
                                .contains("demenagement")
                        || p.getSpecialite() != null &&
                        p.getSpecialite().toLowerCase()
                                .contains("déménagement")
                        || p.getSpecialite() != null &&
                        p.getSpecialite().toLowerCase()
                                .contains("transport"))
                .map(p -> {
                    ProfilPrestataireResponseDTO dto = new ProfilPrestataireResponseDTO();
                    Utilisateur u = p.getUtilisateur();
                    if (u == null) return null;
                    dto.setUtilisateurId(u.getId());
                    dto.setPrenom(u.getPrenom() != null ? u.getPrenom() : "");
                    dto.setNom(u.getNom() != null ? u.getNom() : "");
                    dto.setEmail(u.getEmail() != null ? u.getEmail() : "");
                    dto.setTelephone(u.getTelephone() != null ? u.getTelephone() : "");
                    dto.setPhotoProfil(u.getPhotoProfil() != null ? u.getPhotoProfil() : "");
                    dto.setSpecialite(p.getSpecialite() != null ? p.getSpecialite() : "");
                    dto.setTarifHoraire(p.getTarifHoraire() != null ? p.getTarifHoraire() : 0.0);
                    dto.setZoneIntervention(p.getZoneIntervention() != null ? p.getZoneIntervention() : "");
                    dto.setVille(p.getZoneIntervention() != null ? p.getZoneIntervention() : "");
                    dto.setDisponibilite(p.getDisponibilite() != null ? p.getDisponibilite() : "");
                    return dto;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // ─── Publier un meuble ───────────────────────────────────────────
    public MeubleResponseDTO publierMeuble(MeubleRequestDTO dto, List<MultipartFile> photos) throws IOException {
        Utilisateur vendeur = getUtilisateurConnecte();

        List<String> cheminPhotos = new ArrayList<>();
        if (photos != null && !photos.isEmpty()) {
            cheminPhotos = sauvegarderPhotos(photos);
        }

        Meuble meuble = Meuble.builder()
                .titre(dto.getTitre())
                .description(dto.getDescription())
                .prix(dto.getPrix())
                .etat(dto.getEtat())
                .categorie(dto.getCategorie())
                .ville(dto.getVille())
                .photos(cheminPhotos.isEmpty() ? "" : String.join(",", cheminPhotos))
                .vendeur(vendeur)
                .statut(StatutMeuble.DISPONIBLE)
                .build();

        return toDTO(meubleRepository.save(meuble));
    }

    // ─── Lister tous les meubles disponibles ────────────────────────
    @Transactional(readOnly = true)
    public List<MeubleResponseDTO> listerMeubles() {
        return meubleRepository
                .findByStatutOrderByCreeLeDesc(StatutMeuble.DISPONIBLE)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Détail d'un meuble ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public MeubleResponseDTO getDetail(Long id) {
        Meuble meuble = meubleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meuble non trouvé"));
        return toDTO(meuble);
    }

    // ─── Mes meubles ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MeubleResponseDTO> mesMeubles() {
        Utilisateur u = getUtilisateurConnecte();
        return meubleRepository.findByVendeurIdOrderByCreeLeDesc(u.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Modifier un meuble ──────────────────────────────────────────
    public MeubleResponseDTO modifierMeuble(Long id, MeubleRequestDTO dto,
                                            List<MultipartFile> photos) throws IOException {
        Utilisateur u = getUtilisateurConnecte();
        Meuble meuble = meubleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meuble non trouvé"));

        if (!meuble.getVendeur().getId().equals(u.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier ce meuble");
        }

        meuble.setTitre(dto.getTitre());
        meuble.setDescription(dto.getDescription());
        meuble.setPrix(dto.getPrix());
        meuble.setEtat(dto.getEtat());
        meuble.setCategorie(dto.getCategorie());
        meuble.setVille(dto.getVille());

        if (photos != null && !photos.isEmpty()) {
            List<String> cheminPhotos = sauvegarderPhotos(photos);
            meuble.setPhotos(String.join(",", cheminPhotos));
        }

        return toDTO(meubleRepository.save(meuble));
    }

    // ─── Supprimer un meuble ─────────────────────────────────────────
    public void supprimerMeuble(Long id) {
        Utilisateur u = getUtilisateurConnecte();
        Meuble meuble = meubleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meuble non trouvé"));

        if (!meuble.getVendeur().getId().equals(u.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer ce meuble");
        }

        meubleRepository.delete(meuble);
    }

    // ─── Acheter un meuble ───────────────────────────────────────────
    public MeubleResponseDTO acheterMeuble(Long id) {
        Utilisateur acheteur = getUtilisateurConnecte();
        Meuble meuble = meubleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meuble non trouvé"));

        if (meuble.getVendeur().getId().equals(acheteur.getId())) {
            throw new RuntimeException("Vous ne pouvez pas acheter votre propre meuble");
        }

        if (meuble.getStatut() != StatutMeuble.DISPONIBLE) {
            throw new RuntimeException("Ce meuble n'est plus disponible");
        }

        meuble.setStatut(StatutMeuble.VENDU);
        meuble.setAcheteur(acheteur);
        Meuble saved = meubleRepository.save(meuble);
        MeubleResponseDTO dto = toDTO(saved);

        // Mail au vendeur — non bloquant
        try {
            if (meuble.getVendeur() != null) {
                serviceEmail.envoyerEmailMeubleVendu(
                        meuble.getVendeur(), acheteur,
                        meuble.getTitre(), meuble.getPrix());
            }
        } catch (Exception e) {
            System.err.println("Erreur mail vendeur : " + e.getMessage());
        }

        return dto;
    }

    // ─── Sauvegarde photos ───────────────────────────────────────────
    private List<String> sauvegarderPhotos(List<MultipartFile> photos) throws IOException {
        List<String> chemins = new ArrayList<>();
        Path dossier = Paths.get(uploadDir);
        if (!Files.exists(dossier)) Files.createDirectories(dossier);

        for (MultipartFile photo : photos) {
            if (photo != null && !photo.isEmpty()) {
                String nomFichier = UUID.randomUUID() + "_" + photo.getOriginalFilename();
                Path chemin = dossier.resolve(nomFichier);
                Files.copy(photo.getInputStream(), chemin, StandardCopyOption.REPLACE_EXISTING);
                chemins.add(nomFichier);
            }
        }
        return chemins;
    }

    // ─── Mapper Meuble → DTO ─────────────────────────────────────────
    private MeubleResponseDTO toDTO(Meuble m) {
        MeubleResponseDTO dto = new MeubleResponseDTO();
        dto.setId(m.getId());
        dto.setTitre(m.getTitre());
        dto.setDescription(m.getDescription());
        dto.setPrix(m.getPrix());
        dto.setEtat(m.getEtat());
        dto.setStatut(m.getStatut());
        dto.setCategorie(m.getCategorie());
        dto.setVille(m.getVille());
        dto.setCreeLe(m.getCreeLe());

        if (m.getPhotos() != null && !m.getPhotos().isBlank()) {
            dto.setPhotos(Arrays.asList(m.getPhotos().split(",")));
        } else {
            dto.setPhotos(new ArrayList<>());
        }

        if (m.getVendeur() != null) {
            dto.setVendeurId(m.getVendeur().getId());
            dto.setVendeurPrenom(m.getVendeur().getPrenom());
            dto.setVendeurNom(m.getVendeur().getNom());
            dto.setVendeurEmail(m.getVendeur().getEmail());
            dto.setVendeurTelephone(m.getVendeur().getTelephone());
        }

        return dto;
    }

    // ─── Rendre un meuble disponible (annulation achat) ──────────────
    public MeubleResponseDTO rendreDisponible(Long id) {
        Utilisateur u = getUtilisateurConnecte();
        Meuble meuble = meubleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meuble non trouvé"));

        if (!meuble.getVendeur().getId().equals(u.getId())) {
            throw new RuntimeException("Non autorisé");
        }

        if (meuble.getStatut() != StatutMeuble.VENDU) {
            throw new RuntimeException("Ce meuble n'est pas vendu");
        }

        meuble.setStatut(StatutMeuble.DISPONIBLE);
        meuble.setAcheteur(null);

        return toDTO(meubleRepository.saveAndFlush(meuble));
    }

    public void envoyerRecuSansTransport(Long meubleId) {
        Utilisateur acheteur = getUtilisateurConnecte();
        Meuble meuble = meubleRepository.findById(meubleId)
                .orElseThrow(() -> new RuntimeException("Meuble non trouvé"));

        MeubleResponseDTO dto = toDTO(meuble);

        try {
            byte[] pdf = servicePdf.genererRecuAchat(dto, acheteur, null);
            serviceEmail.envoyerRecuAchatSansTransport(
                    acheteur, meuble.getTitre(), pdf);
        } catch (Exception ignored) {}
    }

    @Transactional(readOnly = true)
    public List<MeubleResponseDTO> mesAchats() {
        Utilisateur u = getUtilisateurConnecte();
        return meubleRepository.findByAcheteurIdOrderByMisAJourLeDesc(u.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }


}
