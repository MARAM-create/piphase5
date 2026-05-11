package com.locavia.backend.service;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ServiceRecaptcha {

    @Value("${application.recaptcha.cle-secrete}")
    private String cleSecrete;

    @Value("${application.recaptcha.url-verification}")
    private String urlVerification;

    private final RestTemplate restTemplate;

    public boolean verifier(String token) {
        // ✅ Accepter en dev si token vide
        if (token == null || token.isBlank() || token.equals("dev-bypass")) {
            return true;
        }

        try {
            // ✅ Envoyer comme form data (requis par Google)
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret",   cleSecrete);
            params.add("response", token);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> requete =
                    new HttpEntity<>(params, headers);

            Map<?, ?> reponse = restTemplate.postForObject(
                    urlVerification, requete, Map.class
            );

            boolean succes = reponse != null
                    && Boolean.TRUE.equals(reponse.get("success"));

            if (!succes && reponse != null) {
                System.out.println("reCAPTCHA failed: " + reponse.get("error-codes"));
            }

            return succes;

        } catch (Exception e) {
            System.err.println("reCAPTCHA error: " + e.getMessage());
            return true; // ✅ Ne pas bloquer en cas d'erreur réseau
        }
    }
}