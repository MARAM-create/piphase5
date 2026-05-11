package com.locavia.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class ServiceOpenAIEmbedding {

    // ---------------------------------------------------------------
    // Get your FREE Jina AI key at https://jina.ai  (1M tokens free)
    // Then add this to application-dev.properties:
    //   jina.api.key=jina_xxxxxxxxxxxxxxxx
    // ---------------------------------------------------------------
    @Value("${jina.api.key:}")
    private String jinaApiKey;

    private static final String JINA_URL   = "https://api.jina.ai/v1/embeddings";
    // multilingual model — handles French perfectly
    private static final String JINA_MODEL = "jina-embeddings-v3";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ServiceOpenAIEmbedding() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Generate embedding vector from text.
     * Primary: Jina AI free API (768 dimensions, multilingual, supports French)
     * Fallback: local keyword-based embedding (128 dimensions)
     */
    public float[] genererEmbedding(String text) {
        if (jinaApiKey != null && !jinaApiKey.isBlank()) {
            try {
                return callJinaApi(text);
            } catch (Exception e) {
                log.error("❌ [EMBEDDING] Jina AI error: {}", e.getMessage());
                log.warn("⚠️ [EMBEDDING] Falling back to FREE local embedding");
            }
        } else {
            log.warn("⚠️ [EMBEDDING] No Jina API key configured (jina.api.key). Using local fallback.");
            log.warn("   → Get your FREE key at https://jina.ai (1 million tokens free, no credit card)");
        }
        return genererEmbeddingGratuit(text);
    }

    // ---------------------------------------------------------------
    // Jina AI call
    // ---------------------------------------------------------------
    private float[] callJinaApi(String text) throws Exception {
        log.info("🚀 [EMBEDDING] Calling Jina AI API (multilingual, French-ready)...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + jinaApiKey);

        // Jina expects: {"model": "...", "input": ["text"]}
        Map<String, Object> body = new HashMap<>();
        body.put("model", JINA_MODEL);
        body.put("input", List.of(text));

        String requestBody = objectMapper.writeValueAsString(body);
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(JINA_URL, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Jina API returned: " + response.getStatusCode() + " - " + response.getBody());
        }

        // Response: {"data": [{"embedding": [0.1, 0.2, ...]}]}
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode embeddingNode = root.path("data").get(0).path("embedding");

        if (embeddingNode.isMissingNode() || !embeddingNode.isArray()) {
            throw new RuntimeException("Unexpected Jina response format: " + response.getBody());
        }

        float[] embedding = new float[embeddingNode.size()];
        for (int i = 0; i < embeddingNode.size(); i++) {
            embedding[i] = (float) embeddingNode.get(i).asDouble();
        }

        log.info("✅ [EMBEDDING] SUCCESS - Jina AI ({} dimensions)", embedding.length);
        return embedding;
    }

    // ---------------------------------------------------------------
    // Cosine similarity
    // ---------------------------------------------------------------

    /**
     * Calculate cosine similarity between two embedding vectors.
     * Handles mixed dimensions (Jina 768d vs local 128d) gracefully.
     */
    public double calculerSimilariteCosinus(float[] vec1, float[] vec2) {
        if (vec1 == null || vec2 == null) {
            log.warn("[SIMILARITY] Null vector detected, returning 0.0");
            return 0.0;
        }

        if (vec1.length != vec2.length) {
            log.info("[SIMILARITY] Mixed dimensions ({} vs {}), using min-dim fallback", vec1.length, vec2.length);
            return calculerSimilariteGratuit(vec1, vec2);
        }

        double dotProduct = 0.0, norm1 = 0.0, norm2 = 0.0;
        for (int i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 == 0 || norm2 == 0) return 0.0;

        double similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        log.info("[SIMILARITY] {}d cosine score = {}", vec1.length, String.format("%.4f", similarity));
        return similarity;
    }

    // ---------------------------------------------------------------
    // JSON serialization helpers (for DB storage)
    // ---------------------------------------------------------------

    public String convertirEnJson(float[] embedding) {
        try {
            return objectMapper.writeValueAsString(embedding);
        } catch (Exception e) {
            log.error("Error converting embedding to JSON: {}", e.getMessage());
            return null;
        }
    }

    public float[] convertirDepuisJson(String json) {
        try {
            return objectMapper.readValue(json, float[].class);
        } catch (Exception e) {
            log.error("Error parsing embedding from JSON: {}", e.getMessage());
            return null;
        }
    }

    // ---------------------------------------------------------------
    // Local keyword-based fallback (no API needed)
    // ---------------------------------------------------------------

    /**
     * FREE FALLBACK: keyword-based embedding — works 100% offline, zero cost.
     * 128 dimensions covering categories relevant to roommate matching.
     */
    public float[] genererEmbeddingGratuit(String text) {
        log.info("🆓 [EMBEDDING] Using FREE local keyword embedding (no API credits needed)");
        log.info("🤖 [EMBEDDING] Model: FREE LOCAL KEYWORD-BASED (128 dimensions)");

        if (text == null || text.isEmpty()) {
            return new float[128];
        }

        String normalized = text.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s]", " ")
                .trim();

        String[] words = normalized.split("\\s+");
        float[] embedding = new float[128];

        Map<String, int[]> categories = new HashMap<>();
        categories.put("sport",      new int[]{0,   10});
        categories.put("fitness",    new int[]{0,   10});
        categories.put("gym",        new int[]{0,   10});
        categories.put("football",   new int[]{0,   10});
        categories.put("basket",     new int[]{0,   10});
        categories.put("music",      new int[]{10,  20});
        categories.put("musique",    new int[]{10,  20});
        categories.put("guitar",     new int[]{10,  20});
        categories.put("piano",      new int[]{10,  20});
        categories.put("lecture",    new int[]{20,  30});
        categories.put("reading",    new int[]{20,  30});
        categories.put("book",       new int[]{20,  30});
        categories.put("livre",      new int[]{20,  30});
        categories.put("gaming",     new int[]{30,  40});
        categories.put("jeu",        new int[]{30,  40});
        categories.put("video",      new int[]{30,  40});
        categories.put("cooking",    new int[]{40,  50});
        categories.put("cuisine",    new int[]{40,  50});
        categories.put("food",       new int[]{40,  50});
        categories.put("voyage",     new int[]{50,  60});
        categories.put("travel",     new int[]{50,  60});
        categories.put("party",      new int[]{60,  70});
        categories.put("soiree",     new int[]{60,  70});
        categories.put("social",     new int[]{60,  70});
        categories.put("calme",      new int[]{70,  80});
        categories.put("quiet",      new int[]{70,  80});
        categories.put("silence",    new int[]{70,  80});
        categories.put("propre",     new int[]{80,  90});
        categories.put("clean",      new int[]{80,  90});
        categories.put("organise",   new int[]{80,  90});
        categories.put("etude",      new int[]{90,  100});
        categories.put("study",      new int[]{90,  100});
        categories.put("ecole",      new int[]{90,  100});
        categories.put("university", new int[]{90,  100});
        categories.put("matinal",    new int[]{100, 110});
        categories.put("morning",    new int[]{100, 110});
        categories.put("nocturne",   new int[]{100, 110});
        categories.put("night",      new int[]{100, 110});
        categories.put("animaux",    new int[]{110, 120});
        categories.put("pet",        new int[]{110, 120});
        categories.put("cat",        new int[]{110, 120});
        categories.put("dog",        new int[]{110, 120});
        categories.put("fumeur",     new int[]{120, 128});
        categories.put("smoke",      new int[]{120, 128});

        for (String word : words) {
            for (Map.Entry<String, int[]> entry : categories.entrySet()) {
                if (word.contains(entry.getKey())) {
                    int[] range = entry.getValue();
                    for (int i = range[0]; i < range[1] && i < embedding.length; i++) {
                        embedding[i] += 0.5f;
                    }
                }
            }
        }

        // Normalize
        float magnitude = 0;
        for (float v : embedding) magnitude += v * v;
        magnitude = (float) Math.sqrt(magnitude);

        if (magnitude > 0) {
            for (int i = 0; i < embedding.length; i++) embedding[i] /= magnitude;
        }

        log.info("✅ [EMBEDDING] SUCCESS - Model: FREE LOCAL ({} dimensions, norm={})",
                embedding.length, String.format("%.4f", magnitude));
        return embedding;
    }

    /**
     * Cosine similarity using only the shared (minimum) dimensions.
     * Used when vectors have different lengths.
     */
    public double calculerSimilariteGratuit(float[] vec1, float[] vec2) {
        if (vec1 == null || vec2 == null) return 0.0;

        int dim = Math.min(vec1.length, vec2.length);
        double dotProduct = 0.0, norm1 = 0.0, norm2 = 0.0;

        for (int i = 0; i < dim; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 == 0 || norm2 == 0) return 0.0;

        double similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        log.info("[SIMILARITY] FREE LOCAL ({} dims): score = {}", dim, String.format("%.4f", similarity));
        return similarity;
    }
}