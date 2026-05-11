package com.locavia.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FurnitureVerificationResult {

    @JsonProperty("isFurniture")
    private boolean isFurniture;

    private double confidence;
    private String label;
    private String message;
}