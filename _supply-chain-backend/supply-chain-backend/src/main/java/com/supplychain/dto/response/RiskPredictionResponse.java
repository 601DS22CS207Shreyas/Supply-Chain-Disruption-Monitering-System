package com.supplychain.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class RiskPredictionResponse {
    private Long id;
    private Long shipmentId;
    private String trackingNumber;
    private Double delayProbability;
    private String riskLevel;            // Derived: LOW/MEDIUM/HIGH/CRITICAL
    private Double estimatedDelayHours;
    private String primaryCause;
    private String llmExplanation;
    private String modelVersion;
    private LocalDateTime predictedAt;
}
