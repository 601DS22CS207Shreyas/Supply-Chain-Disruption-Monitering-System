package com.supplychain.service;

import com.supplychain.client.MLServiceClient;
import com.supplychain.dto.response.RiskPredictionResponse;
import com.supplychain.enums.AlertType;
import com.supplychain.enums.ShipmentStatus;
import com.supplychain.exception.ResourceNotFoundException;
import com.supplychain.model.*;
import com.supplychain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskPredictionServiceImpl implements RiskPredictionService {

    private final ShipmentRepository shipmentRepository;
    private final RiskPredictionRepository predictionRepository;
    private final DisruptionEventRepository eventRepository;
    private final EventShipmentImpactRepository impactRepository;
    private final MLServiceClient mlServiceClient;
    private final AlertService alertService;



    // ── Predict for a single shipment ─────────────────────────────────────────
    @Transactional
    public RiskPredictionResponse predictForShipment(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (shipment.getStatus() == ShipmentStatus.DELIVERED ||
                shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Cannot predict risk for a " + shipment.getStatus() + " shipment."
            );
        }
        // Find nearby active events for this shipment
        List<DisruptionEvent> nearbyEvents = findNearbyEvents(shipment);

        // Call ML service
        RiskPrediction prediction = mlServiceClient.getPrediction(shipment, nearbyEvents);
        prediction.setShipment(shipment);
        predictionRepository.save(prediction);

        // Save impact records
        saveImpactRecords(shipment, nearbyEvents, prediction.getDelayProbability());

        // Auto-generate alerts if risk is high
        triggerAlertsIfNeeded(shipment, prediction);

        log.info("Predicted risk for {}: {}", shipment.getTrackingNumber(), prediction.getDelayProbability());
        return mapToResponse(prediction, shipment);
    }

    // ── Batch predict all active shipments ────────────────────────────────────
    @Transactional
    public List<RiskPredictionResponse> predictAll() {
        List<Shipment> activeShipments = shipmentRepository.findByStatusIn(
                List.of(com.supplychain.enums.ShipmentStatus.PENDING,
                        com.supplychain.enums.ShipmentStatus.IN_TRANSIT,
                        com.supplychain.enums.ShipmentStatus.AT_WAREHOUSE)
        );
        log.info("Running batch prediction for {} active shipments", activeShipments.size());
        return activeShipments.stream()
                .map(s -> predictForShipment(s.getId()))
                .collect(Collectors.toList());
    }

    // ── Get latest prediction ─────────────────────────────────────────────────
    public RiskPredictionResponse getLatestPrediction(Long shipmentId) {
        Optional<RiskPrediction> prediction =
                predictionRepository.findTopByShipmentIdOrderByPredictedAtDesc(shipmentId);
        if (prediction.isEmpty()) {
            throw new ResourceNotFoundException("No prediction found for shipment: " + shipmentId);
        }
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));
        return mapToResponse(prediction.get(), shipment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private List<DisruptionEvent> findNearbyEvents(Shipment shipment) {
        if (shipment.getOriginLat() == null || shipment.getOriginLng() == null) return List.of();
        double delta = 200.0 / 111.0; // 200km radius
        return eventRepository.findActiveEventsNearLocation(
                shipment.getOriginLat() - delta, shipment.getOriginLat() + delta,
                shipment.getOriginLng() - delta, shipment.getOriginLng() + delta
        );
    }

    private void saveImpactRecords(Shipment shipment, List<DisruptionEvent> events, Double riskScore) {
        for (DisruptionEvent event : events) {
            if (!impactRepository.existsByEventIdAndShipmentId(event.getId(), shipment.getId())) {
                impactRepository.save(EventShipmentImpact.builder()
                        .event(event)
                        .shipment(shipment)
                        .impactScore(riskScore)
                        .build());
            }
        }
    }

    private void triggerAlertsIfNeeded(Shipment shipment, RiskPrediction prediction) {
        double score = prediction.getDelayProbability();
        if (score >= 0.9) {
            alertService.createAlert(shipment, AlertType.CRITICAL_RISK_SHIPMENT,
                    "CRITICAL: Shipment " + shipment.getTrackingNumber() +
                            " has a " + Math.round(score * 100) + "% delay risk. Cause: " + prediction.getPrimaryCause(),
                    "CRITICAL");
        } else if (score >= 0.7) {
            alertService.createAlert(shipment, AlertType.HIGH_RISK_SHIPMENT,
                    "HIGH RISK: Shipment " + shipment.getTrackingNumber() +
                            " has a " + Math.round(score * 100) + "% delay risk. Cause: " + prediction.getPrimaryCause(),
                    "HIGH");
        }
    }

    private String computeRiskLevel(Double score) {
        if (score >= 0.9) return "CRITICAL";
        if (score >= 0.7) return "HIGH";
        if (score >= 0.4) return "MEDIUM";
        return "LOW";
    }

    private RiskPredictionResponse mapToResponse(RiskPrediction rp, Shipment shipment) {
        return RiskPredictionResponse.builder()
                .id(rp.getId())
                .shipmentId(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .delayProbability(rp.getDelayProbability())
                .riskLevel(computeRiskLevel(rp.getDelayProbability()))
                .estimatedDelayHours(rp.getEstimatedDelayHours())
                .primaryCause(rp.getPrimaryCause())
                .llmExplanation(rp.getLlmExplanation())
                .modelVersion(rp.getModelVersion())
                .predictedAt(rp.getPredictedAt())
                .build();
    }
}
