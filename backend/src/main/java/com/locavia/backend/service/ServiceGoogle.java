package com.locavia.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.locavia.backend.dto.ReponseAuth;
import com.locavia.backend.dto.UtilisateurDTO;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.Statut;
import com.locavia.backend.exception.ExceptionMetier;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class ServiceGoogle {

    @Value("${application.google.client-id}")
    private String clientId;

    private final UtilisateurRepository utilisateurRepository;
    private final ServiceJwt            serviceJwt;

    public ReponseAuth authentifier(String idToken) {
        try {
            GoogleIdTokenVerifier verificateur =
                    new GoogleIdTokenVerifier.Builder(
                            new NetHttpTransport(),
                            GsonFactory.getDefaultInstance())
                            .setAudience(Collections.singletonList(clientId))
                            .build();

            GoogleIdToken tokenGoogle = verificateur.verify(idToken);
            if (tokenGoogle == null) {
                throw new ExceptionMetier("Token Google invalide ou expiré");
            }

            GoogleIdToken.Payload payload = tokenGoogle.getPayload();
            String email       = payload.getEmail();
            String googleId    = payload.getSubject();
            String prenom      = (String) payload.get("given_name");
            String nom         = (String) payload.get("family_name");
            String photoProfil = (String) payload.get("picture");

            // Créer ou récupérer l'utilisateur
            Utilisateur utilisateur = utilisateurRepository
                    .findByEmail(email)
                    .orElseGet(() -> utilisateurRepository.save(
                            Utilisateur.builder()
                                    .email(email)
                                    .googleId(googleId)
                                    .prenom(prenom != null ? prenom : "")
                                    .nom(nom != null ? nom : "")
                                    .photoProfil(photoProfil)
                                    .role(Role.ETUDIANT)
                                    .statut(Statut.EN_ATTENTE_ADMIN)
                                    .emailVerifie(true)
                                    .build()
                    ));

            // Mettre à jour si 1ère connexion Google sur compte existant
            if (utilisateur.getGoogleId() == null) {
                utilisateur.setGoogleId(googleId);
                utilisateur.setEmailVerifie(true);
                if (utilisateur.getStatut() == Statut.EN_ATTENTE_EMAIL) {
                    utilisateur.setStatut(Statut.EN_ATTENTE_ADMIN);
                }
                utilisateurRepository.save(utilisateur);
            }

            if (utilisateur.getStatut() != Statut.ACTIF) {
                throw new ExceptionMetier(
                        "Compte non actif. Statut actuel : " + utilisateur.getStatut());
            }

            return ReponseAuth.builder()
                    .token(serviceJwt.genererToken(utilisateur))
                    .utilisateur(versDTO(utilisateur))
                    .build();

        } catch (ExceptionMetier e) {
            throw e;
        } catch (Exception e) {
            throw new ExceptionMetier("Erreur lors de l'authentification Google");
        }
    }

    private UtilisateurDTO versDTO(Utilisateur u) {
        return UtilisateurDTO.builder()
                .id(u.getId()).prenom(u.getPrenom()).nom(u.getNom())
                .email(u.getEmail()).telephone(u.getTelephone())
                .photoProfil(u.getPhotoProfil()).bio(u.getBio())
                .role(u.getRole()).statut(u.getStatut())
                .emailVerifie(u.getEmailVerifie()).creeLe(u.getCreeLe())
                .build();
    }
}