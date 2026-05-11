package com.locavia.backend.service;

import com.locavia.backend.dto.FurnitureVerificationResult;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class FurnitureVerificationService {

    private final WebClient webClient;

    public FurnitureVerificationService(WebClient.Builder builder) {
        this.webClient = builder
                .baseUrl("http://localhost:5001")
                .build();
    }

    public FurnitureVerificationResult verify(MultipartFile image) {
        try {
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("file", new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            }).contentType(MediaType.IMAGE_JPEG);

            return webClient.post()
                    .uri("/api/furniture/verify")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(FurnitureVerificationResult.class)
                    .block();

        } catch (Exception e) {
            FurnitureVerificationResult error = new FurnitureVerificationResult();
            error.setFurniture(false);
            error.setMessage("Erreur de connexion au service IA");
            return error;
        }
    }
}