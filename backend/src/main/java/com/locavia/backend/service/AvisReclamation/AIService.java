package com.locavia.backend.service.AvisReclamation;

import com.locavia.backend.enums.ReclamationPriority;
import com.locavia.backend.enums.SentimentType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;

    public SentimentType analyzeSentiment(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("text", text), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/sentiment", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String sentiment = (String) response.getBody().get("sentiment");
                return SentimentType.valueOf(sentiment);
            }
        } catch (Exception e) {
            log.error("Error calling AI sentiment service: {}", e.getMessage());
        }
        return SentimentType.NEUTRAL;
    }

    public String classifyReclamation(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("text", text), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/classify", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("category");
            }
        } catch (Exception e) {
            log.error("Error calling AI classify service: {}", e.getMessage());
        }
        return "OTHER";
    }

    public ReclamationPriority detectPriority(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("text", text), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/priority", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String priority = (String) response.getBody().get("priority");
                return ReclamationPriority.valueOf(priority);
            }
        } catch (Exception e) {
            log.error("Error calling AI priority service: {}", e.getMessage());
        }
        return ReclamationPriority.LOW;
    }
}
