package com.supplychain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_predictions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RiskPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    // ML model output: probability of delay (0.0 - 1.0)
    @Column(nullable = false)
    private Double delayProbability;

    // Estimated delay duration from ML model
    private Double estimatedDelayHours;

    // Primary cause determined by the model
    private String primaryCause;   // e.g. "Cyclone near route"

    // LLM-generated human-readable explanation
    @Column(columnDefinition = "TEXT")
    private String llmExplanation;

    // JSON snapshot of features used for this prediction (for explainability)
    @Column(columnDefinition = "TEXT")
    private String featureSnapshot;

    // Which model version produced this prediction
    private String modelVersion;

    @CreationTimestamp
    private LocalDateTime predictedAt;
}
