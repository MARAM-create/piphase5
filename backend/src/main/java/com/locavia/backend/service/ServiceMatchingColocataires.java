package com.locavia.backend.service;

import com.locavia.backend.dto.ReponseMatchColocataireDTO;
import com.locavia.backend.dto.RequeteQuestionnaireDTO;
import com.locavia.backend.entity.ProfilEtudiant;
import com.locavia.backend.entity.Utilisateur;
import com.locavia.backend.exception.ExceptionMetier;
import com.locavia.backend.repository.ProfilEtudiantRepository;
import com.locavia.backend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ServiceMatchingColocataires {

    private final ProfilEtudiantRepository profilRepository;
    private final UtilisateurRepository    utilisateurRepository;
    private final ServiceOpenAIEmbedding   embeddingService;
    private final JavaMailSender           mailSender;

    @Value("${spring.mail.username}")
    private String emailAdmin;

    private static final double POIDS_IA           = 0.70;
    private static final double POIDS_CONTRAINTES  = 0.30;
    private static final double SCORE_MIN_AFFICHAGE = 0.15;

    // ── Save questionnaire + generate Jina AI embedding ─────────────────────

    public void sauvegarderQuestionnaire(String email, RequeteQuestionnaireDTO dto) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur non trouvé"));

        ProfilEtudiant profil = profilRepository.findByUtilisateur(user)
                .orElse(ProfilEtudiant.builder().utilisateur(user).build());

        if (dto.getUniversite()              != null) profil.setUniversite(dto.getUniversite());
        if (dto.getFiliere()                 != null) profil.setFiliere(dto.getFiliere());
        if (dto.getDescriptionPersonnelle()  != null) profil.setDescriptionPersonnelle(dto.getDescriptionPersonnelle());
        if (dto.getHoraireType()             != null) profil.setHoraireType(dto.getHoraireType());
        if (dto.getNiveauProprete()          != null) profil.setNiveauProprete(dto.getNiveauProprete());
        if (dto.getFrequenceInvites()        != null) profil.setFrequenceInvites(dto.getFrequenceInvites());
        if (dto.getFumeur()                  != null) profil.setFumeur(dto.getFumeur());
        if (dto.getAccepteFumeur()           != null) profil.setAccepteFumeur(dto.getAccepteFumeur());
        if (dto.getAAnimaux()                != null) profil.setAAnimaux(dto.getAAnimaux());
        if (dto.getAccepteAnimaux()          != null) profil.setAccepteAnimaux(dto.getAccepteAnimaux());
        if (dto.getBudgetMaxColocation()     != null) profil.setBudgetMaxColocation(dto.getBudgetMaxColocation());
        if (dto.getBudgetMax()               != null) profil.setBudgetMax(dto.getBudgetMax());
        if (dto.getVilleRechercheColocation() != null) profil.setVilleRechercheColocation(dto.getVilleRechercheColocation());
        if (dto.getVilleRecherche()          != null) profil.setVilleRecherche(dto.getVilleRecherche());
        if (dto.getTrancheAgeRecherche()     != null) profil.setTrancheAgeRecherche(dto.getTrancheAgeRecherche());
        if (dto.getSexePrefere()             != null) profil.setSexePrefereColocataire(dto.getSexePrefere());
        if (dto.getMemeUniversitePrefere()   != null) profil.setMemeUniversitePrefere(dto.getMemeUniversitePrefere());

        if (dto.getHobbies() != null && !dto.getHobbies().isEmpty()) {
            profil.setHobbies(String.join(",", dto.getHobbies()));
        }

        if (dto.getNiveauEtude() != null && !dto.getNiveauEtude().isBlank()) {
            try {
                profil.setNiveauEtude(ProfilEtudiant.NiveauEtude.valueOf(dto.getNiveauEtude()));
            } catch (IllegalArgumentException ignored) {}
        }

        String textePersonnalite = construireTextePersonnalite(dto);
        log.info("🤖 [MATCHING] Generating embedding for: {}", user.getEmail());
        log.info("📝 [MATCHING] Text sent to Jina AI: {}", textePersonnalite);

        float[] embedding = embeddingService.genererEmbedding(textePersonnalite);
        profil.setVecteurPersonnalite(embeddingService.convertirEnJson(embedding));

        profilRepository.save(profil);
        log.info("✅ [MATCHING] Profile saved with embedding ({} dims) for {}", embedding.length, email);
    }

    // ── Find matches using cosine similarity ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<ReponseMatchColocataireDTO> trouverMatches(String email, int limit) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur non trouvé"));

        ProfilEtudiant monProfil = profilRepository.findByUtilisateur(user)
                .orElseThrow(() -> new ExceptionMetier(
                        "Profil incomplet. Veuillez d'abord remplir le questionnaire."));

        if (monProfil.getVecteurPersonnalite() == null) {
            throw new ExceptionMetier(
                    "Questionnaire incomplet. Remplissez tous les champs obligatoires pour obtenir des matches.");
        }

        float[] monEmbedding = embeddingService.convertirDepuisJson(monProfil.getVecteurPersonnalite());

        List<ProfilEtudiant> autresProfils = profilRepository.findAllWithEmbeddingExcept(user.getId());

        log.info("🔍 [MATCHING] Scoring {} candidate profiles for {}", autresProfils.size(), email);

        return autresProfils.stream()
                .map(p -> calculerScore(monProfil, monEmbedding, p))
                .filter(r -> r.getScoreCompatibilite() > (int)(SCORE_MIN_AFFICHAGE * 100))
                .sorted((a, b) -> Integer.compare(b.getScoreCompatibilite(), a.getScoreCompatibilite()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ── Check status ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public boolean questionnaireEstComplet(String email) {
        return utilisateurRepository.findByEmail(email)
                .flatMap(profilRepository::findByUtilisateur)
                .map(p -> p.getVecteurPersonnalite() != null)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public int compterMatchesDisponibles(String email) {
        return utilisateurRepository.findByEmail(email)
                .map(user -> profilRepository.findAllWithEmbeddingExcept(user.getId()).size())
                .orElse(0);
    }

    // ── Send contact email between two matched students ──────────────────────

    public void contacterColocataire(String emailExpediteur, Long destinataireId, String message) {
        Utilisateur expediteur = utilisateurRepository.findByEmail(emailExpediteur)
                .orElseThrow(() -> new ExceptionMetier("Utilisateur non trouvé"));
        Utilisateur destinataire = utilisateurRepository.findById(destinataireId)
                .orElseThrow(() -> new ExceptionMetier("Colocataire non trouvé"));

        String html = """
            <!DOCTYPE html><html lang="fr"><body
              style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:40px 20px">
                  <table width="600" cellpadding="0" cellspacing="0"
                    style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
                    <tr>
                      <td style="background:linear-gradient(135deg,#1a4731,#16a34a);padding:32px;text-align:center">
                        <h1 style="color:white;margin:0;font-size:24px">🏠 Locavia Matching</h1>
                        <p style="color:rgba(255,255,255,.85);margin:8px 0 0">Mise en relation colocataires</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 32px">
                        <p style="color:#374151;font-size:16px">
                          Bonjour <strong>%s</strong>,
                        </p>
                        <p style="color:#4b5563">
                          <strong>%s %s</strong> vous a envoyé un message via Locavia Matching :
                        </p>
                        <div style="background:#f0fdf4;border-left:4px solid #16a34a;
                                    border-radius:8px;padding:20px 24px;margin:24px 0;
                                    color:#1f2937;font-size:15px;line-height:1.6">
                          %s
                        </div>
                        <p style="color:#6b7280;font-size:13px">
                          Pour répondre, connectez-vous sur Locavia et rendez-vous dans la section
                          <strong>Trouver vos colocataires</strong>.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f9fafb;padding:20px;text-align:center;
                                 border-top:1px solid #e5e7eb">
                        <p style="color:#9ca3af;font-size:12px;margin:0">© 2025 Locavia</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(
                destinataire.getPrenom(),
                expediteur.getPrenom(), expediteur.getNom(),
                message
        );

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(emailAdmin);
            helper.setTo(destinataire.getEmail());
            helper.setSubject("Locavia — " + expediteur.getPrenom() + " " + expediteur.getNom() + " vous a contacté !");
            helper.setText(html, true);
            mailSender.send(mime);
            log.info("✉️ [MATCHING] Contact email sent from {} to {}", emailExpediteur, destinataire.getEmail());
        } catch (MessagingException e) {
            log.error("❌ [MATCHING] Failed to send contact email: {}", e.getMessage());
            throw new ExceptionMetier("Impossible d'envoyer le message. Réessayez plus tard.");
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private ReponseMatchColocataireDTO calculerScore(
            ProfilEtudiant moi, float[] monEmb, ProfilEtudiant autre) {

        float[] autreEmb = embeddingService.convertirDepuisJson(autre.getVecteurPersonnalite());
        double scoreIA = embeddingService.calculerSimilariteCosinus(monEmb, autreEmb);
        double scoreContraintes = calculerScoreContraintes(moi, autre);
        double scoreFinal = (scoreIA * POIDS_IA) + (scoreContraintes * POIDS_CONTRAINTES);

        log.debug("[MATCHING] {} → IA={} Contraintes={} Final={}",
                autre.getUtilisateur().getEmail(),
                String.format("%.3f", scoreIA),
                String.format("%.3f", scoreContraintes),
                String.format("%.3f", scoreFinal));

        Utilisateur u = autre.getUtilisateur();
        return ReponseMatchColocataireDTO.builder()
                .utilisateurId(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .photoProfil(u.getPhotoProfil())
                .age(u.getAge())
                .universite(autre.getUniversite())
                .filiere(autre.getFiliere())
                .villeRecherche(autre.getVilleRechercheColocation())
                .budgetMax(autre.getBudgetMaxColocation())
                .scoreCompatibilite((int) Math.min(100, scoreFinal * 100))
                .hobbies(parseListe(autre.getHobbies()))
                .descriptionPersonnelle(autre.getDescriptionPersonnelle())
                .pointsCommuns(trouverPointsCommuns(moi, autre))
                .build();
    }

    private double calculerScoreContraintes(ProfilEtudiant moi, ProfilEtudiant autre) {
        double score = 0.0;

        // Ville (40%)
        String maVille    = nvl(moi.getVilleRechercheColocation());
        String autreVille = nvl(autre.getVilleRechercheColocation());
        if (!maVille.isEmpty() && !autreVille.isEmpty() &&
                maVille.equalsIgnoreCase(autreVille)) {
            score += 0.40;
        }

        // Budget (30%)
        Double monBudget   = moi.getBudgetMaxColocation();
        Double autreBudget = autre.getBudgetMaxColocation();
        if (monBudget != null && autreBudget != null && monBudget > 0 && autreBudget > 0) {
            double ratio = Math.min(monBudget, autreBudget) / Math.max(monBudget, autreBudget);
            score += 0.30 * ratio;
        }

        // Fumeur (15%)
        boolean fumeurOk = true;
        if (Boolean.TRUE.equals(moi.getFumeur())   && Boolean.FALSE.equals(autre.getAccepteFumeur())) fumeurOk = false;
        if (Boolean.TRUE.equals(autre.getFumeur())  && Boolean.FALSE.equals(moi.getAccepteFumeur()))  fumeurOk = false;
        if (fumeurOk) score += 0.15;

        // Animaux (15%)
        boolean animauxOk = true;
        if (Boolean.TRUE.equals(moi.getAAnimaux())   && Boolean.FALSE.equals(autre.getAccepteAnimaux())) animauxOk = false;
        if (Boolean.TRUE.equals(autre.getAAnimaux())  && Boolean.FALSE.equals(moi.getAccepteAnimaux()))  animauxOk = false;
        if (animauxOk) score += 0.15;

        return score;
    }

    private List<String> trouverPointsCommuns(ProfilEtudiant moi, ProfilEtudiant autre) {
        List<String> points = new ArrayList<>();

        if (nvl(moi.getUniversite()).equalsIgnoreCase(nvl(autre.getUniversite()))
                && !nvl(moi.getUniversite()).isEmpty()) {
            points.add("Même université : " + moi.getUniversite());
        }

        if (nvl(moi.getVilleRechercheColocation()).equalsIgnoreCase(
                nvl(autre.getVilleRechercheColocation()))
                && !nvl(moi.getVilleRechercheColocation()).isEmpty()) {
            points.add("Même ville recherchée : " + moi.getVilleRechercheColocation());
        }

        if (nvl(moi.getHoraireType()).equals(nvl(autre.getHoraireType()))
                && !nvl(moi.getHoraireType()).isEmpty()) {
            points.add("Horaire " + moi.getHoraireType());
        }

        if (nvl(moi.getNiveauProprete()).equals(nvl(autre.getNiveauProprete()))
                && !nvl(moi.getNiveauProprete()).isEmpty()) {
            points.add("Même niveau de propreté");
        }

        List<String> mesHobbies    = parseListe(moi.getHobbies());
        List<String> autresHobbies = parseListe(autre.getHobbies());
        mesHobbies.retainAll(autresHobbies);
        if (!mesHobbies.isEmpty()) {
            points.add("Hobbies communs : " + String.join(", ", mesHobbies));
        }

        return points;
    }

    private String construireTextePersonnalite(RequeteQuestionnaireDTO dto) {
        StringBuilder sb = new StringBuilder();

        if (dto.getDescriptionPersonnelle() != null && !dto.getDescriptionPersonnelle().isBlank()) {
            sb.append(dto.getDescriptionPersonnelle()).append(". ");
        }
        if (dto.getHobbies() != null && !dto.getHobbies().isEmpty()) {
            sb.append("Mes loisirs sont : ").append(String.join(", ", dto.getHobbies())).append(". ");
        }
        if (dto.getHoraireType() != null) {
            sb.append("Je suis de type ").append(dto.getHoraireType()).append(". ");
        }
        if (dto.getNiveauProprete() != null) {
            sb.append("Mon niveau de propreté est ").append(dto.getNiveauProprete()).append(". ");
        }
        if (dto.getFrequenceInvites() != null) {
            sb.append("J'invite des amis ").append(dto.getFrequenceInvites()).append(". ");
        }
        if (dto.getUniversite() != null) {
            sb.append("J'étudie à ").append(dto.getUniversite()).append(". ");
        }
        if (dto.getFiliere() != null) {
            sb.append("Ma filière est ").append(dto.getFiliere()).append(". ");
        }

        String result = sb.toString().trim();
        return result.isEmpty() ? "étudiant cherchant colocation" : result;
    }

    private List<String> parseListe(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        List<String> list = new ArrayList<>();
        for (String s : csv.split(",")) {
            String t = s.trim().toLowerCase();
            if (!t.isEmpty()) list.add(t);
        }
        return list;
    }

    private String nvl(String s) { return s == null ? "" : s.trim(); }
}
