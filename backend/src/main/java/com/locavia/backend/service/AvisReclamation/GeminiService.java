package com.locavia.backend.service.AvisReclamation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final RestTemplate restTemplate;

    @Value("${openrouter.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String apiUrl;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String chat(String userMessage) {
        String messageLower = userMessage.toLowerCase();
        
        if (messageLower.contains("meilleurs logements")) {
            return "Voici nos meilleurs logements disponibles pour étudiants en Tunisie !\n\n" +
                   "Vous pouvez filtrer par :\n" +
                   "📍 Ville (Tunis, Sfax, Sousse...)\n" +
                   "💰 Budget mensuel\n" +
                   "🏘️ Type : Studio / Appartement / Colocation\n\n" +
                   "👉 Rendez-vous dans la section \"Annonces\" pour voir toutes les offres disponibles.\n\n" +
                   "Vous cherchez une colocation ou un logement seul ?";
        } else if (messageLower.contains("réclamation") || messageLower.contains("reclamation")) {
            return "Pour déposer une réclamation, suivez ces étapes :\n\n" +
                   "1️⃣ Allez dans la section \"Réclamation/Avis\"\n" +
                   "2️⃣ Cliquez sur \"Nouvelle réclamation\"\n" +
                   "3️⃣ Décrivez votre problème\n" +
                   "4️⃣ Soumettez — notre équipe vous répondra sous 48h\n\n" +
                   "Vous avez un problème urgent ? Précisez-le dans votre réclamation.";
        } else if (messageLower.contains("conseils")) {
            return "Voici quelques conseils pour bien choisir votre logement étudiant :\n\n" +
                   "✅ Vérifiez la proximité de votre université\n" +
                   "✅ Lisez bien le contrat avant de signer\n" +
                   "✅ Vérifiez les charges incluses (eau, électricité...)\n" +
                   "✅ Visitez le logement avant tout paiement\n" +
                   "✅ Privilégiez la colocation pour réduire les coûts\n\n" +
                   "Besoin d'autres conseils ? Posez votre question !";
        }

        if (apiKey == null || apiKey.isBlank()) {
            return "Le service de chat IA n'est pas configuré. Veuillez configurer la clé API OpenRouter.";
        }

        int maxRetries = 2;
        int delayMs = 2000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // OpenRouter est une API globale gratuite qui contourne les restrictions régionales de Google
                String url = "https://openrouter.ai/api/v1/chat/completions";

                Map<String, Object> requestBody = Map.of(
                        "model", "inclusionai/ling-2.6-flash:free",
                        "messages", List.of(
                                Map.of("role", "system", "content", 
                                       "Tu es un assistant intelligent pour Locavia, une plateforme de logement étudiant en Tunisie. " +
                                       "Réponds de manière courte, amicale, intelligente et toujours en français pour guider l'étudiant. " +
                                       "Tes domaines de compétence sont : les annonces de location et colocation, les demandes de services, " +
                                       "les contrats et paiements, la messagerie, les réclamations et avis, et l'utilisation générale de la plateforme."),
                                Map.of("role", "user", "content", userMessage)
                        )
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + apiKey);
                headers.set("HTTP-Referer", "http://localhost:4200"); // Optionnel
                headers.set("X-Title", "Locavia"); // Optionnel

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                    if (choices != null && !choices.isEmpty()) {
                        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                        if (message != null && message.get("content") != null) {
                            return (String) message.get("content");
                        }
                    }
                }

                return "Désolé, je n'ai pas pu générer une réponse correcte.";

            } catch (HttpClientErrorException e) {
                if (e.getStatusCode().value() == 429) {
                    if (attempt == maxRetries) {
                        return "⏳ Le service IA est temporairement surchargé. Veuillez réessayer dans quelques secondes.";
                    }
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return "Erreur d'interruption.";
                    }
                } else {
                    log.error("OpenRouter API client error {}: {}", e.getStatusCode(), e.getMessage());
                    return "Erreur OpenRouter (" + e.getStatusCode() + ") : " + e.getResponseBodyAsString() + " (Clé lue: " + (apiKey != null && apiKey.length() > 5 ? apiKey.substring(0,5) : "vide") + "...)";
                }
            } catch (Exception e) {
                log.error("Error calling OpenRouter API: {}", e.getMessage());
                return "Erreur lors de la communication avec le service IA. Veuillez réessayer.";
            }
        }
        
        return "Désolé, je n'ai pas pu traiter votre demande après plusieurs tentatives.";
    }
}
