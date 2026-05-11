package com.locavia.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import com.locavia.backend.dto.ContratLocationResponseDTO;
import com.locavia.backend.dto.VerificationResponseDTO;
import com.locavia.backend.entity.ContratLocation;
import com.locavia.backend.enums.IAValidationStatus;
import com.locavia.backend.enums.StatutContrat;
import com.locavia.backend.enums.StatutIa;
import com.locavia.backend.exception.ContractComplianceException;
import com.locavia.backend.exception.ServiceUnavailableException;
import com.locavia.backend.mapper.ContratLocationMapper;
import com.locavia.backend.repository.ContratLocationRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;

/**
 * Service de vérification de conformité des contrats de location par Google Gemini 1.5 Flash.
 *
 * <h2>Modèle et Endpoint</h2>
 * <pre>
 * POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}
 * </pre>
 * Gemini 1.5 Flash supporte nativement les PDFs via {@code inlineData} (Base64 + mimeType
 * {@code application/pdf}). Aucune conversion préalable en image n'est nécessaire.
 *
 * <h2>Trois éléments visuels recherchés</h2>
 * <ol>
 *   <li><b>TAMPON_OFFICIEL</b> — cachet/estampille officiel(le)</li>
 *   <li><b>SIGNATURE_PROPRIETAIRE</b> — signature manuscrite du bailleur</li>
 *   <li><b>SIGNATURE_LOCATAIRE</b> — signature manuscrite du locataire</li>
 * </ol>
 *
 * <h2>Stratégie d'erreur (sans fallback algorithmique)</h2>
 * <ul>
 *   <li><b>Timeout réseau</b> ({@link ResourceAccessException}) → 2 tentatives avec backoff
 *       exponentiel (2 s, 4 s), puis {@link ServiceUnavailableException} HTTP 503.</li>
 *   <li><b>Restriction régionale</b> (HTTP 403 / LOCATION_NOT_SUPPORTED) → échec immédiat
 *       HTTP 503 avec message distinct et conseils de contournement.</li>
 *   <li><b>Quota épuisé</b> (HTTP 429) → HTTP 503 avec délai de réessai suggéré.</li>
 *   <li><b>Contrat non conforme</b> → HTTP 400 via {@link ContractComplianceException}
 *       portant la liste exacte des éléments manquants.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IAVerificationService {

    // ── Modèle Gemini ─────────────────────────────────────────────────────────
    // gemini-2.5-flash : disponible sur v1beta, confirmé par curl
    private static final String GEMINI_MODEL    = "gemini-2.5-flash";
    private static final String GEMINI_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/"
            + GEMINI_MODEL + ":generateContent?key=";

    // ── Retry sur timeout réseau ──────────────────────────────────────────────
    /** Nombre maximum de tentatives supplémentaires après la première. */
    private static final int    MAX_RETRIES          = 2;
    /** Délai de base entre tentatives (ms) — chaque tentative double le délai. */
    private static final long   RETRY_BACKOFF_MS     = 2_000L;

    // ── Noms canoniques des éléments visuels ─────────────────────────────────
    static final String ELEMENT_TAMPON                = "TAMPON_OFFICIEL";
    static final String ELEMENT_SIGNATURE_PROPRIETAIRE = "SIGNATURE_PROPRIETAIRE";
    static final String ELEMENT_SIGNATURE_LOCATAIRE    = "SIGNATURE_LOCATAIRE";

    private static final List<String> ALL_REQUIRED_ELEMENTS = List.of(
            ELEMENT_TAMPON, ELEMENT_SIGNATURE_PROPRIETAIRE, ELEMENT_SIGNATURE_LOCATAIRE);

    private final ContratLocationRepository contratLocationRepository;
    private final ContratLocationMapper     contratLocationMapper;
    private final RestTemplate              restTemplate;
    private final ObjectMapper              objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // =========================================================================
    // Méthode principale — déclenchée après upload
    // =========================================================================

    /**
     * Analyse le document scanné d'un contrat via Gemini et met à jour son statut.
     *
     * <p>Flux :
     * <ol>
     *   <li>Lit le fichier depuis le disque et l'encode en Base64.</li>
     *   <li>Envoie le PDF à Gemini 1.5 Flash (support natif PDF via {@code inlineData}).</li>
     *   <li>Parse la réponse JSON structurée produite par le modèle.</li>
     *   <li>Si conforme → {@code statutIa = VALIDE}, {@code statutContrat = EN_ATTENTE_PAIEMENT}.</li>
     *   <li>Si non conforme → {@code statutIa = REJETE}, lève {@link ContractComplianceException}.</li>
     *   <li>Si API inaccessible → lève {@link ServiceUnavailableException} (HTTP 503).</li>
     * </ol>
     *
     * @param contratId l'identifiant du contrat à analyser
     * @return le DTO du contrat mis à jour (uniquement si conforme)
     * @throws ContractComplianceException si le contrat est non conforme
     * @throws ServiceUnavailableException si Gemini est inaccessible
     */
    public ContratLocationResponseDTO analyserDocument(Long contratId) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ContratLocation introuvable avec l'id : " + contratId));

        if (contrat.getStatutIa() != StatutIa.EN_COURS_ANALYSE) {
            throw new IllegalStateException(
                    "Impossible de lancer l'analyse IA : statut actuel = "
                    + contrat.getStatutIa() + " (attendu : EN_COURS_ANALYSE). "
                    + "Veuillez d'abord uploader le document scanné.");
        }

        String scanPath = contrat.getImageScanneUrl();
        if (scanPath == null || scanPath.isBlank()) {
            throw new IllegalStateException(
                    "Aucun document scanné associé au contrat id=" + contratId);
        }

        // ── Lire les bytes depuis le disque ───────────────────────────────────
        byte[] pdfBytes = readFileBytes(scanPath, contratId);
        log.info("📄 Contrat id={} : {} octets lus depuis '{}', envoi à Gemini {}...",
                contratId, pdfBytes.length, scanPath, GEMINI_MODEL);

        // ── Appel IA (STRICT — pas de fallback algorithmique) ─────────────────
        VerificationResponseDTO verification = callGeminiWithRetry(pdfBytes, contratId);

        // ── Mise à jour de l'entité ───────────────────────────────────────────
        return applyVerificationResult(contrat, verification);
    }

    /**
     * Surcharge pour analyse directe depuis des bytes déjà lus en mémoire.
     *
     * <p>Appelé par {@code ContratLocationServiceImpl} après avoir lu le
     * {@link org.springframework.web.multipart.MultipartFile} une seule fois
     * (pour écriture sur disque + envoi à Gemini, sans double lecture I/O).
     *
     * @param contratId identifiant du contrat
     * @param pdfBytes  contenu binaire du document PDF déjà lu en mémoire
     * @return DTO du contrat mis à jour
     */
    public ContratLocationResponseDTO analyserDocument(Long contratId, byte[] fileBytes) {
        ContratLocation contrat = contratLocationRepository.findById(contratId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ContratLocation introuvable avec l'id : " + contratId));

        String mimeType = detectMimeType(fileBytes);
        log.info("📄 Contrat id={} : {} octets reçus en mémoire ({}), envoi à Gemini {}...",
                contratId, fileBytes.length, mimeType, GEMINI_MODEL);

        VerificationResponseDTO verification = callGeminiWithRetry(fileBytes, mimeType, contratId);
        return applyVerificationResult(contrat, verification);
    }

    // =========================================================================
    // Vérification de conformité — noyau IA
    // =========================================================================

    /**
     * Envoie le PDF brut à Gemini 1.5 Flash avec une logique de retry sur timeout réseau.
     *
     * <p><b>Comportement selon le type d'erreur :</b>
     * <ul>
     *   <li>{@link ResourceAccessException} (timeout/DNS) → retry x{@value MAX_RETRIES}
     *       avec backoff exponentiel de {@value RETRY_BACKOFF_MS} ms.</li>
     *   <li>HTTP 403 / LOCATION_NOT_SUPPORTED → échec immédiat, message "restriction régionale".</li>
     *   <li>HTTP 400 → échec immédiat, message "clé invalide ou prompt refusé".</li>
     *   <li>HTTP 429 → échec immédiat, message "quota épuisé".</li>
     * </ul>
     *
     * @param fileData  contenu binaire du document
     * @param contratId identifiant du contrat (utilisé dans les logs)
     * @return {@link VerificationResponseDTO} peuplé depuis la réponse Gemini
     * @throws ServiceUnavailableException quel que soit le type d'échec
     */
    public VerificationResponseDTO callGeminiWithRetry(byte[] fileData, Long contratId) {
        return callGeminiWithRetry(fileData, detectMimeType(fileData), contratId);
    }

    public VerificationResponseDTO callGeminiWithRetry(byte[] fileData, String mimeType, Long contratId) {
        String base64Data  = Base64.getEncoder().encodeToString(fileData);
        String requestBody = buildGeminiRequest(base64Data, mimeType);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<String> httpEntity = new HttpEntity<>(requestBody, headers);

        String url = GEMINI_BASE_URL + geminiApiKey;

        // ── Tentative initiale + retries sur timeout réseau uniquement ────
        ResourceAccessException lastNetworkError = null;

        for (int attempt = 1; attempt <= 1 + MAX_RETRIES; attempt++) {
            try {
                if (attempt > 1) {
                    long backoffMs = RETRY_BACKOFF_MS * (long) Math.pow(2, attempt - 2);
                    log.warn("⏳ [Gemini] Tentative {}/{} dans {} ms (contrat id={})...",
                            attempt, 1 + MAX_RETRIES, backoffMs, contratId);
                    Thread.sleep(backoffMs);
                }

                log.info("🤖 [Gemini {} — tentative {} | {}] Analyse contrat id={}",
                        GEMINI_MODEL, attempt, mimeType, contratId);

                ResponseEntity<String> response = restTemplate.postForEntity(url, httpEntity, String.class);
                return parseGeminiResponse(response.getBody(), contratId);

            } catch (ResourceAccessException e) {
                lastNetworkError = e;
                log.warn("🌐 [Gemini] Timeout/réseau (tentative {}/{}) pour contrat id={}: {}",
                        attempt, 1 + MAX_RETRIES, contratId, e.getMessage());

            } catch (HttpClientErrorException e) {
                handleClientError(e, contratId);
                throw new IllegalStateException("unreachable");

            } catch (HttpServerErrorException e) {
                log.error("❌ [Gemini] Erreur serveur HTTP {} pour contrat id={}: {}",
                        e.getStatusCode(), contratId, e.getMessage());
                throw new ServiceUnavailableException(
                        "Serveur Gemini indisponible (HTTP " + e.getStatusCode()
                        + "). Réessayez dans quelques minutes.", e);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ServiceUnavailableException("Analyse IA interrompue.", e);
            }
        }

        log.error("❌ [Gemini] {} tentatives réseau épuisées pour contrat id={}. Dernière erreur : {}",
                1 + MAX_RETRIES, contratId,
                lastNetworkError != null ? lastNetworkError.getMessage() : "inconnue");
        throw new ServiceUnavailableException(
                "Impossible de joindre l'API Gemini après " + (1 + MAX_RETRIES)
                + " tentatives (timeout ou DNS). Vérifiez la connectivité réseau du serveur.",
                lastNetworkError);
    }

    // =========================================================================
    // Construction du prompt / de la requête Gemini
    // =========================================================================

    /**
     * Construit le corps JSON de la requête {@code generateContent}.
     *
     * <p>Le PDF est envoyé via {@code inlineData} — support natif de Gemini 1.5 Flash
     * pour les PDFs encodés en Base64. La config {@code responseMimeType: "application/json"}
     * force une réponse JSON pure ; le prompt la réitère pour robustesse.
     */
    private String buildGeminiRequest(String base64Data, String mimeType) {
        String prompt = buildCompliancePrompt();
        return "{"
                + "\"contents\":[{"
                +   "\"parts\":["
                +     "{"
                +       "\"inlineData\":{"
                +         "\"mimeType\":\"" + mimeType + "\","
                +         "\"data\":\"" + base64Data + "\""
                +       "}"
                +     "},"
                +     "{"
                +       "\"text\":" + toJsonString(prompt)
                +     "}"
                +   "]"
                + "}],"
                + "\"generationConfig\":{"
                +   "\"temperature\":0.1,"
                +   "\"max_output_tokens\":1000,"
                +   "\"response_mime_type\":\"application/json\""
                + "}"
                + "}";
    }

    /**
     * Prompt optimisé pour la détection des 3 éléments visuels obligatoires
     * dans des scans/photos (JPEG, PNG) et des PDF.
     *
     * <p>Le modèle est instruit de :
     * <ul>
     *   <li>Repérer <b>exactement 1 tampon officiel</b> (cachet rond ou rectangulaire avec texte)</li>
     *   <li>Repérer <b>exactement 1 signature manuscrite du propriétaire</b> (Bailleur)</li>
     *   <li>Repérer <b>exactement 1 signature manuscrite du locataire</b> (Locataire / Étudiant)</li>
     * </ul>
     * La réponse attendue est du JSON pur, sans balise Markdown ni texte d'entourage.
     */
    private String buildCompliancePrompt() {
        return "Analyze this scan/photo of a rental contract. "
                + "Detect exactly: 1 Stamp (TAMPON_OFFICIEL), 1 Owner Signature (SIGNATURE_PROPRIETAIRE), "
                + "1 Tenant Signature (SIGNATURE_LOCATAIRE). "
                + "Return ONLY this JSON (no backticks, no markdown):\n"
                + "{\n"
                + "  \"isCompliant\": <boolean: true if all 3 are present>,\n"
                + "  \"missingElements\": [<string[]: keys of absent elements>],\n"
                + "  \"detectedElements\": [<string[]: keys of present elements>],\n"
                + "  \"confidenceScore\": <number: 0.0 to 1.0>\n"
                + "}";
    }

    // =========================================================================
    // Parsing de la réponse Gemini
    // =========================================================================

    /**
     * Extrait et parse le JSON retourné par Gemini.
     *
     * <p>Gemini encapsule le texte dans {@code candidates[0].content.parts[0].text}.
     * Avec {@code responseMimeType:"application/json"}, ce texte est du JSON pur.
     * Par défense, on purge toute balise Markdown accidentelle (`` ```json ... ``` ``).
     */
    private VerificationResponseDTO parseGeminiResponse(String rawResponse, Long contratId) {
        try {
            // ── 1. Naviguer dans l'enveloppe Gemini ──────────────────────────
            JsonNode root = objectMapper.readTree(rawResponse);

            // Vérifier l'éventuel champ "error" retourné par Gemini
            if (root.has("error")) {
                String errMsg  = root.path("error").path("message").asText("inconnu");
                int    errCode = root.path("error").path("code").asInt(0);
                log.error("❌ [Gemini] Erreur dans le corps de la réponse (code={}) : {}", errCode, errMsg);
                handleGeminiBodyError(errCode, errMsg, contratId);
            }

            String rawText = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text")
                    .asText();

            // ── 2. Purger d'éventuelles balises Markdown ──────────────────────
            String jsonText = stripMarkdownFences(rawText);
            log.debug("[Gemini] Texte brut reçu pour contrat id={}: {}", contratId, jsonText);

            // ── 3. Parser le JSON de Gemini ───────────────────────────────────
            JsonNode result = objectMapper.readTree(jsonText);

            boolean isCompliant    = result.path("isCompliant").asBoolean(false);
            double  confidenceScore = result.path("confidenceScore").asDouble(0.0);

            List<String> missing  = new ArrayList<>();
            result.path("missingElements").forEach(n -> missing.add(n.asText()));

            List<String> detected = new ArrayList<>();
            result.path("detectedElements").forEach(n -> detected.add(n.asText()));

            // ── 4. Correction défensive ───────────────────────────────────────
            // Si conforme mais Gemini a oublié de lister les éléments détectés
            if (detected.isEmpty() && isCompliant) {
                detected.addAll(ALL_REQUIRED_ELEMENTS);
                log.debug("[Gemini] detectedElements absent mais isCompliant=true — liste complétée.");
            }
            // Reconstituer missingElements si Gemini a mis isCompliant=false sans les lister
            if (missing.isEmpty() && !isCompliant) {
                List<String> computed = new ArrayList<>(ALL_REQUIRED_ELEMENTS);
                computed.removeAll(detected);
                missing.addAll(computed);
                log.debug("[Gemini] missingElements absent mais isCompliant=false — liste calculée : {}", missing);
            }

            log.info("[Gemini {}] Contrat id={} → conforme={}, confiance={}, manquants={}",
                    GEMINI_MODEL, contratId, isCompliant, confidenceScore, missing);

            return VerificationResponseDTO.builder()
                    .contratId(contratId)
                    .isCompliant(isCompliant)
                    .missingElements(missing)
                    .detectedElements(detected)
                    .confidenceScore(confidenceScore)
                    .modelUsed(GEMINI_MODEL)
                    .analysisMessage(buildAnalysisMessage(isCompliant, missing, confidenceScore))
                    .build();

        } catch (ServiceUnavailableException e) {
            throw e; // propagation directe des erreurs IA déjà typées
        } catch (Exception e) {
            log.error("❌ Impossible de parser la réponse Gemini pour contrat id={}: {}", contratId, e.getMessage());
            log.error("   Réponse brute complète : {}", rawResponse);
            throw new ServiceUnavailableException(
                    "La réponse de Gemini n'a pas pu être analysée (JSON malformé). "
                    + "Réponse brute loguée à niveau ERROR.", e);
        }
    }

    // =========================================================================
    // Gestion fine des erreurs HTTP 4xx
    // =========================================================================

    /**
     * Analyse une {@link HttpClientErrorException} et lève la {@link ServiceUnavailableException}
     * appropriée avec un message distinct selon la cause.
     */
    private void handleClientError(HttpClientErrorException e, Long contratId) {
        HttpStatusCode status      = e.getStatusCode();
        String         body        = e.getResponseBodyAsString();
        boolean        isLocationBlock = body.contains("LOCATION_NOT_SUPPORTED")
                                      || body.contains("User location is not supported");

        log.error("❌ [Gemini] HTTP {} pour contrat id={} | location_block={} | body={}",
                status, contratId, isLocationBlock, body);

        if (status == HttpStatus.FORBIDDEN || (status == HttpStatus.BAD_REQUEST && isLocationBlock)) {
            // ── Restriction géographique ──────────────────────────────────────
            throw new ServiceUnavailableException(
                    "API Gemini BLOQUÉE pour votre région (HTTP " + status
                    + " — LOCATION_NOT_SUPPORTED). "
                    + "Solutions recommandées : "
                    + "(1) Cloudflare Worker comme proxy HTTPS transparent, "
                    + "(2) VPN côté serveur avec IP US/EU, "
                    + "(3) Firebase Vertex AI (hors quota GCP standard).", e);
        }

        if (status == HttpStatus.BAD_REQUEST) {
            // ── Clé invalide, modèle inconnu, prompt refusé ──────────────────
            throw new ServiceUnavailableException(
                    "Requête refusée par Gemini (HTTP 400). Causes possibles : "
                    + "clé API invalide, modèle introuvable, ou contenu de la requête rejeté. "
                    + "Détail : " + body, e);
        }

        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            // ── Quota épuisé ──────────────────────────────────────────────────
            throw new ServiceUnavailableException(
                    "Quota Gemini épuisé (HTTP 429). Réessayez dans quelques minutes "
                    + "ou augmentez votre quota sur Google AI Studio.", e);
        }

        if (status == HttpStatus.UNAUTHORIZED) {
            throw new ServiceUnavailableException(
                    "Clé API Gemini non autorisée (HTTP 401). "
                    + "Vérifiez la valeur de gemini.api.key dans application.properties.", e);
        }

        throw new ServiceUnavailableException(
                "Erreur API Gemini (HTTP " + status + ") — vérification impossible. Détail : " + body, e);
    }

    /**
     * Gère les erreurs Gemini encapsulées dans le corps JSON de la réponse (HTTP 200 mais contenu d'erreur).
     */
    private void handleGeminiBodyError(int code, String message, Long contratId) {
        boolean isLocationBlock = message.contains("LOCATION_NOT_SUPPORTED")
                               || message.contains("User location is not supported");

        if (isLocationBlock || code == 403) {
            throw new ServiceUnavailableException(
                    "API Gemini BLOQUÉE pour votre région (LOCATION_NOT_SUPPORTED). "
                    + "Configurez un proxy (Cloudflare Worker) ou un VPN côté serveur.", null);
        }
        throw new ServiceUnavailableException(
                "Gemini a retourné une erreur dans le corps de la réponse (code="
                + code + ") : " + message, null);
    }

    // =========================================================================
    // Mise à jour de l'entité selon le résultat IA
    // =========================================================================

    private ContratLocationResponseDTO applyVerificationResult(
            ContratLocation contrat, VerificationResponseDTO verification) {

        if (verification.isCompliant()) {
            contrat.setStatutIa(StatutIa.VALIDE);
            contrat.setStatutContrat(StatutContrat.EN_ATTENTE_PAIEMENT);
            contrat.setIaValidationStatus(IAValidationStatus.VALIDATED);
            contrat.setRaisonIa(buildRaisonIa(verification));

            ContratLocation saved = contratLocationRepository.save(contrat);
            log.info("✅ Contrat id={} VALIDÉ par Gemini — confiance={}",
                    contrat.getId(), verification.getConfidenceScore());
            return contratLocationMapper.toResponseDTO(saved);

        } else {
            // Persister le rejet avant de lever l'exception
            contrat.setStatutIa(StatutIa.REJETE);
            contrat.setIaValidationStatus(IAValidationStatus.REJECTED);
            contrat.setRaisonIa("Éléments manquants : " + verification.getMissingElements());
            contratLocationRepository.save(contrat);

            log.warn("❌ Contrat id={} REJETÉ — éléments manquants : {}",
                    contrat.getId(), verification.getMissingElements());

            throw new ContractComplianceException(
                    verification.getMissingElements(),
                    verification.getConfidenceScore());
        }
    }

    // =========================================================================
    // Utilitaires
    // =========================================================================

    /** Lit le fichier depuis le chemin persisté sur disque. */
    private byte[] readFileBytes(String scanPath, Long contratId) {
        try {
            Path filePath = Paths.get(scanPath).toAbsolutePath().normalize();
            if (!Files.exists(filePath)) {
                throw new IllegalStateException(
                        "Fichier scanné introuvable : " + filePath
                        + " pour le contrat id=" + contratId);
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Erreur I/O lecture fichier pour contrat id={}", contratId, e);
            throw new RuntimeException(
                    "Impossible de lire le fichier scanné pour le contrat id=" + contratId, e);
        }
    }

    /**
     * Détecte le MIME type d'un fichier en lisant ses magic bytes.
     * <ul>
     *   <li>JPEG : commence par {@code FF D8 FF}</li>
     *   <li>PNG  : commence par {@code 89 50 4E 47} (‑PNG)</li>
     *   <li>PDF  : commence par {@code 25 50 44 46} (%PDF)</li>
     * </ul>
     * Par défaut {@code application/pdf} si le type est inconnu.
     */
    private String detectMimeType(byte[] data) {
        if (data == null || data.length < 4) return "application/pdf";
        // JPEG: FF D8 FF
        if ((data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47
        if ((data[0] & 0xFF) == 0x89 && (data[1] & 0xFF) == 0x50
                && (data[2] & 0xFF) == 0x4E && (data[3] & 0xFF) == 0x47) {
            return "image/png";
        }
        // PDF: %PDF  (25 50 44 46)
        if ((data[0] & 0xFF) == 0x25 && (data[1] & 0xFF) == 0x50
                && (data[2] & 0xFF) == 0x44 && (data[3] & 0xFF) == 0x46) {
            return "application/pdf";
        }
        log.warn("⚠️ Type de fichier non reconnu (magic bytes: {:02X} {:02X} {:02X} {:02X}) — fallback application/pdf",
                data[0] & 0xFF, data[1] & 0xFF, data[2] & 0xFF, data[3] & 0xFF);
        return "application/pdf";
    }


    /**
     * Supprime les balises Markdown (`` ```json ... ``` `` ou `` ``` ... `` ``)
     * qu'un modèle LLM peut parfois ajouter malgré {@code responseMimeType:"application/json"}.
     */
    private String stripMarkdownFences(String text) {
        if (text == null) return "{}";
        String trimmed = text.trim();
        // Supprimer ```json ... ``` ou ``` ... ```
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence    = trimmed.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private String buildRaisonIa(VerificationResponseDTO v) {
        return String.format(
                "Analyse Gemini %s — Confiance : %.0f%%. Éléments détectés : %s.",
                GEMINI_MODEL,
                v.getConfidenceScore() * 100,
                v.getDetectedElements());
    }

    private String buildAnalysisMessage(boolean isCompliant, List<String> missing, double confidence) {
        if (isCompliant) {
            return String.format(
                    "Contrat conforme. Les 3 éléments obligatoires ont été détectés "
                    + "(tampon + 2 signatures). Confiance : %.0f%%.", confidence * 100);
        }
        return String.format(
                "Contrat NON conforme. Éléments manquants : %s (confiance : %.0f%%). "
                + "Veuillez re-signer le contrat et le re-scanner.", missing, confidence * 100);
    }

    /** Sérialise une chaîne Java en valeur JSON correctement échappée. */
    private String toJsonString(String value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "\"" + value.replace("\\", "\\\\")
                               .replace("\"", "\\\"")
                               .replace("\n", "\\n")
                               .replace("\r", "\\r") + "\"";
        }
    }
}

