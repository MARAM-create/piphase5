package com.locavia.backend.service;


import com.locavia.backend.dto.*;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.Statut;
import com.locavia.backend.exception.ExceptionMetier;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceAuth {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder       encodeur;
    private final ServiceJwt            serviceJwt;
    private final ServiceEmail          serviceEmail;
    private final ServiceRecaptcha      serviceRecaptcha;
    private final ServiceTwilio         serviceTwilio;

    @Value("${application.tentatives-max:3}")
    private int tentativesMax;

    @Value("${application.blocage-secondes:30}")
    private int blocageSecondes;

    // ── Inscription + OTP ────────────────────────────────
    public void inscrire(DemandeInscription demande) {

        if (demande.getRole() == Role.ADMIN) {
            throw new ExceptionMetier(
                    "Ce rôle n'est pas autorisé à l'inscription");
        }

        if (utilisateurRepository.existsByEmail(demande.getEmail())) {
            throw new ExceptionMetier("Cet email est déjà utilisé");
        }

        // Générer OTP
        String otp = serviceTwilio.genererOtp();

       Utilisateur utilisateur = Utilisateur.builder()
                .prenom(demande.getPrenom().trim())
                .nom(demande.getNom().trim())
                .email(demande.getEmail().toLowerCase().trim())
                .motDePasse(encodeur.encode(demande.getMotDePasse()))
                .telephone(demande.getTelephone())
                .role(demande.getRole())
                .statut(Statut.EN_ATTENTE_EMAIL)
                .emailVerifie(false)
                .otpCode(otp)
                .otpExpiration(LocalDateTime.now().plusMinutes(10))
                .build();

        utilisateurRepository.save(utilisateur);

        // Envoyer OTP : SMS si téléphone, email sinon
        if (demande.getTelephone() != null
                && !demande.getTelephone().isBlank()) {
            serviceTwilio.envoyerOtpSms(demande.getTelephone(), otp);
        } else {
            serviceEmail.envoyerOtpEmail(utilisateur, otp);
        }

        // ✅ Notifier l'admin
        serviceEmail.notifierAdminNouvelInscrit(utilisateur);
    }

    // ── Vérification OTP ─────────────────────────────────
    public void verifierOtp(String email, String otp) {
        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ExceptionMetier("Utilisateur introuvable"));

        if (utilisateur.getOtpCode() == null
                || !utilisateur.getOtpCode().equals(otp)) {
            throw new ExceptionMetier("Code OTP invalide");
        }

        if (utilisateur.getOtpExpiration().isBefore(LocalDateTime.now())) {
            throw new ExceptionMetier("Code OTP expiré");
        }

        utilisateur.setEmailVerifie(true);
        utilisateur.setOtpCode(null);
        utilisateur.setOtpExpiration(null);
        utilisateur.setStatut(Statut.EN_ATTENTE_ADMIN);
        utilisateurRepository.save(utilisateur);
    }

    // ── Renvoyer OTP ─────────────────────────────────────
    public void renvoyerOtp(String email) {
        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ExceptionMetier("Utilisateur introuvable"));

        if (utilisateur.getStatut() != Statut.EN_ATTENTE_EMAIL) {
            throw new ExceptionMetier("Compte déjà vérifié");
        }

        String otp = serviceTwilio.genererOtp();
        utilisateur.setOtpCode(otp);
        utilisateur.setOtpExpiration(LocalDateTime.now().plusMinutes(10));
        utilisateurRepository.save(utilisateur);

        if (utilisateur.getTelephone() != null
                && !utilisateur.getTelephone().isBlank()) {
            serviceTwilio.envoyerOtpSms(utilisateur.getTelephone(), otp);
        } else {
            serviceEmail.envoyerOtpEmail(utilisateur, otp);
        }
    }

    // ── Connexion avec blocage 3 tentatives ──────────────
    @Transactional(noRollbackFor = ExceptionMetier.class)
    public ReponseAuth connecter(
            DemandeConnexion demande,
            String ip,
            String userAgent) {

        // ✅ Vérifier reCAPTCHA
       // if (!serviceRecaptcha.verifier(demande.getRecaptchaToken())) {
        //    throw new ExceptionMetier("Vérification reCAPTCHA échouée");
       // }

        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(demande.getEmail().toLowerCase().trim())
                .orElseThrow(() ->
                        new ExceptionMetier("Email ou mot de passe incorrect"));

        // ✅ Vérifier blocage
        if (utilisateur.getBloqueJusquA() != null
                && utilisateur.getBloqueJusquA().isAfter(LocalDateTime.now())) {
            long secondes = Duration.between(
                    LocalDateTime.now(),
                    utilisateur.getBloqueJusquA()
            ).getSeconds();
            throw new ExceptionMetier(
                    "Compte bloqué. Réessayez dans " + secondes + " seconde(s)."
            );
        }

        // ✅ Vérifier mot de passe
        if (!encodeur.matches(
                demande.getMotDePasse(),
                utilisateur.getMotDePasse())) {

            int tentatives = (utilisateur.getTentativesConnexion() == null
                    ? 0 : utilisateur.getTentativesConnexion()) + 1;

            utilisateur.setTentativesConnexion(tentatives);

            if (tentatives >= tentativesMax) {
                utilisateur.setBloqueJusquA(
                        LocalDateTime.now().plusSeconds(blocageSecondes));
                utilisateur.setTentativesConnexion(0);
                utilisateurRepository.save(utilisateur);
                throw new ExceptionMetier(
                        "Trop de tentatives. Compte bloqué "
                                + blocageSecondes + " secondes."
                );
            }

            utilisateurRepository.save(utilisateur);
            int restantes = tentativesMax - tentatives;
            throw new ExceptionMetier(
                    "Mot de passe incorrect. "
                            + restantes + " tentative(s) restante(s)."
            );
        }

        // ✅ Mot de passe correct — réinitialiser tentatives
        utilisateur.setTentativesConnexion(0);
        utilisateur.setBloqueJusquA(null);

        // ✅ Vérifier statut
        switch (utilisateur.getStatut()) {
            case EN_ATTENTE_EMAIL ->
                    throw new ExceptionMetier(
                            "Veuillez vérifier votre adresse email");
            case EN_ATTENTE_ADMIN ->
                    throw new ExceptionMetier(
                            "Votre compte est en attente de validation par l'administrateur");
            case REJETE ->
                    throw new ExceptionMetier(
                            "Votre demande d'inscription a été refusée");
            case BANNI ->
                    throw new ExceptionMetier(
                            "Votre compte a été suspendu");
            default -> {}
        }

        // ✅ Détection nouveau device
        boolean nouveauDevice = ip != null
                && !ip.equals(utilisateur.getDernierIp())
                && utilisateur.getDernierIp() != null;

        if (nouveauDevice) {
            serviceEmail.envoyerAlerteNouveauDevice(
                    utilisateur, ip, userAgent != null ? userAgent : "Inconnu"
            );
        }

        // Mettre à jour IP et User-Agent
        utilisateur.setDernierIp(ip);
        utilisateur.setDernierUserAgent(userAgent);
        utilisateurRepository.save(utilisateur);

        return ReponseAuth.builder()
                .token(serviceJwt.genererToken(utilisateur))
                .utilisateur(versDTO(utilisateur))
                .build();
    }

    // ── Mot de passe oublié ──────────────────────────────
    public void oublierMotDePasse(DemandeOublierMdp demande) {
        utilisateurRepository
                .findByEmail(demande.getEmail().toLowerCase().trim())
                .ifPresent(utilisateur -> {
                    String token = UUID.randomUUID().toString();
                    utilisateur.setTokenReinitMdp(token);
                    utilisateur.setExpirationTokenMdp(
                            LocalDateTime.now().plusHours(1));
                    utilisateurRepository.save(utilisateur);
                    serviceEmail.envoyerEmailReinitMdp(utilisateur);
                });
    }

    // ── Réinitialisation MDP ─────────────────────────────
    public void reinitialiserMotDePasse(DemandeReinitMdp demande) {
        Utilisateur utilisateur = utilisateurRepository
                .findByTokenReinitMdp(demande.getToken())
                .orElseThrow(() ->
                        new ExceptionMetier("Lien de réinitialisation invalide"));

        if (utilisateur.getExpirationTokenMdp()
                .isBefore(LocalDateTime.now())) {
            throw new ExceptionMetier("Le lien a expiré");
        }

        utilisateur.setMotDePasse(
                encodeur.encode(demande.getNouveauMotDePasse()));
        utilisateur.setTokenReinitMdp(null);
        utilisateur.setExpirationTokenMdp(null);
        utilisateurRepository.save(utilisateur);
    }

    // ── Profil ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public UtilisateurDTO obtenirProfil(String email) {
        return utilisateurRepository.findByEmail(email)
                .map(this::versDTO)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur introuvable"));
    }

    public UtilisateurDTO mettreAJourProfil(String email, UtilisateurDTO dto) {
        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(email)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur introuvable"));

        if (dto.getPrenom()      != null) utilisateur.setPrenom(dto.getPrenom());
        if (dto.getNom()         != null) utilisateur.setNom(dto.getNom());
        if (dto.getTelephone()   != null) utilisateur.setTelephone(dto.getTelephone());
        if (dto.getBio()         != null) utilisateur.setBio(dto.getBio());
        if (dto.getPhotoProfil() != null) utilisateur.setPhotoProfil(dto.getPhotoProfil());

        return versDTO(utilisateurRepository.save(utilisateur));
    }

    public UtilisateurDTO versDTO(Utilisateur u) {
        return UtilisateurDTO.builder()
                .id(u.getId())
                .prenom(u.getPrenom())
                .nom(u.getNom())
                .email(u.getEmail())
                .telephone(u.getTelephone())
                .photoProfil(u.getPhotoProfil())
                .bio(u.getBio())
                .role(u.getRole())
                .statut(u.getStatut())
                .emailVerifie(u.getEmailVerifie())
                .creeLe(u.getCreeLe())
                .build();
    }
}