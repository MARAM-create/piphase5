package com.locavia.backend.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locavia.backend.dto.GoogleMeetCreateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class GoogleMeetService {
    @Value("${google.meet.base-url}")
    private String baseUrl;

    @Value("${google.meet.access-token:}")
    private String accessToken;


    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.refresh.token}")
    private String refreshToken;

    private final ObjectMapper objectMapper;
    private String getAccessToken() {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("refresh_token", refreshToken);
        body.add("grant_type", "refresh_token");

        HttpEntity<MultiValueMap<String, String>> request =
                new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://oauth2.googleapis.com/token",
                    request,
                    String.class
            );

            System.out.println("GOOGLE TOKEN RESPONSE = " + response.getBody());

            JsonNode json = objectMapper.readTree(response.getBody());

            if (!json.has("access_token") || json.path("access_token").asText().isBlank()) {
                throw new RuntimeException("Aucun access_token retourné par Google : " + response.getBody());
            }

            return json.path("access_token").asText();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Impossible d'obtenir l'access token Google : " + e.getMessage(), e);
        }
    }




    public GoogleMeetCreateResponse createMeetingSpace() {
        String accessToken = getAccessToken();
        String url = baseUrl + "/spaces";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>("{}", headers);

        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class
            );

            System.out.println("GOOGLE MEET RESPONSE = " + response.getBody());

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Erreur création Google Meet : " + response.getStatusCode());
            }

            JsonNode json = objectMapper.readTree(response.getBody());
            GoogleMeetCreateResponse dto = new GoogleMeetCreateResponse();
            dto.setName(json.path("name").asText(null));
            dto.setMeetingCode(json.path("meetingCode").asText(null));
            dto.setMeetingUri(json.path("meetingUri").asText(null));

            if (dto.getMeetingUri() == null || dto.getMeetingUri().isBlank()) {
                throw new RuntimeException("Google Meet créé sans meetingUri : " + response.getBody());
            }

            return dto;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erreur Google Meet détaillée : " + e.getMessage(), e);
        }
    }
}
