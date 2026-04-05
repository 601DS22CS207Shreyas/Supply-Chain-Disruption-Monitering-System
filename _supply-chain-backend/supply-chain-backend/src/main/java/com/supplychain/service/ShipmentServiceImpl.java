package com.supplychain.service;

import com.supplychain.dto.request.CreateShipmentRequest;
import com.supplychain.dto.request.UpdateShipmentStatusRequest;
import com.supplychain.dto.response.AlertResponse;
import com.supplychain.dto.response.RiskPredictionResponse;
import com.supplychain.dto.response.ShipmentDetailResponse;
import com.supplychain.dto.response.ShipmentResponse;
import com.supplychain.enums.ShipmentStatus;
import com.supplychain.exception.ResourceNotFoundException;
import com.supplychain.model.Alert;
import com.supplychain.model.RiskPrediction;
import com.supplychain.model.Shipment;
import com.supplychain.model.ShipmentRoute;
import com.supplychain.repository.AlertRepository;
import com.supplychain.repository.RiskPredictionRepository;
import com.supplychain.repository.ShipmentRepository;
import com.supplychain.repository.ShipmentRouteRepository;
import com.supplychain.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentRouteRepository routeRepository;
    private final RiskPredictionRepository riskPredictionRepository;
    private final AlertRepository alertRepository;  // ← added

    // ── Create ────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest req) {
        String trackingNumber = generateTrackingNumber();

        Shipment shipment = Shipment.builder()
                .trackingNumber(trackingNumber)
                .origin(req.getOrigin())
                .destination(req.getDestination())
                .carrier(req.getCarrier())
                .transportMode(req.getTransportMode())
                .status(ShipmentStatus.PENDING)
                .cargoDescription(req.getCargoDescription())
                .cargoWeightKg(req.getCargoWeightKg())
                .cargoValueUsd(req.getCargoValueUsd())
                .scheduledDeparture(req.getScheduledDeparture())
                .scheduledArrival(req.getScheduledArrival())
                .originLat(req.getOriginLat())
                .originLng(req.getOriginLng())
                .destinationLat(req.getDestinationLat())
                .destinationLng(req.getDestinationLng())
                .build();

        shipment = shipmentRepository.save(shipment);

        if (req.getWaypoints() != null && !req.getWaypoints().isEmpty()) {
            Shipment finalShipment = shipment;
            List<ShipmentRoute> waypoints = req.getWaypoints().stream()
                    .map(w -> ShipmentRoute.builder()
                            .shipment(finalShipment)
                            .waypointOrder(w.getWaypointOrder())
                            .city(w.getCity())
                            .country(w.getCountry())
                            .lat(w.getLat())
                            .lng(w.getLng())
                            .estimatedArrival(w.getEstimatedArrival())
                            .build())
                    .collect(Collectors.toList());
            routeRepository.saveAll(waypoints);
        }

        log.info("Created shipment: {}", trackingNumber);
        return mapToResponse(shipment, null);
    }

    // ── Read: List ────────────────────────────────────────────────────────────
    @Override
    public Page<ShipmentResponse> getShipments(String search, ShipmentStatus status, Pageable pageable) {
        Page<Shipment> page;

        if (search != null && !search.isBlank()) {
            page = shipmentRepository.searchShipments(search, pageable);
        } else if (status != null) {
            page = shipmentRepository.findByStatus(status, pageable);
        } else {
            page = shipmentRepository.findAll(pageable);
        }

        return page.map(s -> {
            Optional<RiskPrediction> prediction =
                    riskPredictionRepository.findTopByShipmentIdOrderByPredictedAtDesc(s.getId());
            return mapToResponse(s, prediction.orElse(null));
        });
    }

    // ── Read: Detail ──────────────────────────────────────────────────────────
    @Override
    public ShipmentDetailResponse getShipmentDetail(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + id));

        List<ShipmentRoute> routes = routeRepository.findByShipmentIdOrderByWaypointOrder(id);

        Optional<RiskPrediction> prediction =
                riskPredictionRepository.findTopByShipmentIdOrderByPredictedAtDesc(id);

        List<Alert> alerts = alertRepository.findByShipmentIdOrderByCreatedAtDesc(id);

        return mapToDetailResponse(shipment, routes, prediction.orElse(null), alerts);
    }

    @Override
    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + id));
    }

    // ── Update Status ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public ShipmentResponse updateStatus(Long id, UpdateShipmentStatusRequest req) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(req.getStatus());
        if (req.getActualDeparture() != null) shipment.setActualDeparture(req.getActualDeparture());
        if (req.getActualArrival() != null) shipment.setActualArrival(req.getActualArrival());
        shipmentRepository.save(shipment);
        log.info("Updated shipment {} status to {}", shipment.getTrackingNumber(), req.getStatus());
        return mapToResponse(shipment, null);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void deleteShipment(Long id) {
        if (!shipmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Shipment not found with id: " + id);
        }
        shipmentRepository.deleteById(id);
        log.info("Deleted shipment id: {}", id);
    }

    // ── Active shipments for batch prediction ─────────────────────────────────
    @Override
    public List<Shipment> getActiveShipments() {
        return shipmentRepository.findByStatusIn(
                List.of(ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT, ShipmentStatus.AT_WAREHOUSE)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String generateTrackingNumber() {
        return "SC-" + System.currentTimeMillis() % 100000 + "-" +
                UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private String computeRiskLevel(Double score) {
        if (score == null) return "UNKNOWN";
        if (score >= 0.9) return "CRITICAL";
        if (score >= 0.7) return "HIGH";
        if (score >= 0.4) return "MEDIUM";
        return "LOW";
    }

    private ShipmentResponse mapToResponse(Shipment s, RiskPrediction rp) {
        Double riskScore = rp != null ? rp.getDelayProbability() : null;
        return ShipmentResponse.builder()
                .id(s.getId())
                .trackingNumber(s.getTrackingNumber())
                .origin(s.getOrigin())
                .destination(s.getDestination())
                .carrier(s.getCarrier())
                .transportMode(s.getTransportMode())
                .status(s.getStatus())
                .scheduledDeparture(s.getScheduledDeparture())
                .scheduledArrival(s.getScheduledArrival())
                .actualArrival(s.getActualArrival())
                .latestRiskScore(riskScore)
                .riskLevel(computeRiskLevel(riskScore))
                .createdAt(s.getCreatedAt())
                .build();
    }

    // ── Updated: now takes alerts and builds full detail response ─────────────
    private ShipmentDetailResponse mapToDetailResponse(
            Shipment s,
            List<ShipmentRoute> routes,
            RiskPrediction rp,
            List<Alert> alerts) {

        // Map waypoints
        List<ShipmentDetailResponse.WaypointResponse> waypointResponses = routes.stream()
                .map(r -> ShipmentDetailResponse.WaypointResponse.builder()
                        .waypointOrder(r.getWaypointOrder())
                        .city(r.getCity())
                        .country(r.getCountry())
                        .lat(r.getLat())
                        .lng(r.getLng())
                        .estimatedArrival(r.getEstimatedArrival())
                        .actualArrival(r.getActualArrival())
                        .build())
                .collect(Collectors.toList());

        // Map prediction
        RiskPredictionResponse predictionResponse = null;
        if (rp != null) {
            predictionResponse = RiskPredictionResponse.builder()
                    .id(rp.getId())
                    .shipmentId(s.getId())
                    .trackingNumber(s.getTrackingNumber())
                    .delayProbability(rp.getDelayProbability())
                    .riskLevel(computeRiskLevel(rp.getDelayProbability()))
                    .estimatedDelayHours(rp.getEstimatedDelayHours())
                    .primaryCause(rp.getPrimaryCause())
                    .llmExplanation(rp.getLlmExplanation())
                    .modelVersion(rp.getModelVersion())
                    .predictedAt(rp.getPredictedAt())
                    .build();
        }

        // Map alerts (latest 3 only)
        List<AlertResponse> alertResponses = alerts.stream()
                .limit(3)
                .map(a -> AlertResponse.builder()
                        .id(a.getId())
                        .shipmentId(s.getId())
                        .trackingNumber(s.getTrackingNumber())
                        .alertType(a.getAlertType())
                        .message(a.getMessage())
                        .severity(a.getSeverity())
                        .isRead(a.getIsRead())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ShipmentDetailResponse.builder()
                .id(s.getId())
                .trackingNumber(s.getTrackingNumber())
                .origin(s.getOrigin())
                .destination(s.getDestination())
                .carrier(s.getCarrier())
                .transportMode(s.getTransportMode())
                .status(s.getStatus())
                .cargoDescription(s.getCargoDescription())
                .cargoWeightKg(s.getCargoWeightKg())
                .cargoValueUsd(s.getCargoValueUsd())
                .scheduledDeparture(s.getScheduledDeparture())
                .scheduledArrival(s.getScheduledArrival())
                .actualDeparture(s.getActualDeparture())
                .actualArrival(s.getActualArrival())
                .originLat(s.getOriginLat())
                .originLng(s.getOriginLng())
                .destinationLat(s.getDestinationLat())
                .destinationLng(s.getDestinationLng())
                .waypoints(waypointResponses)
                .latestPrediction(predictionResponse)   // ← now populated
                .recentAlerts(alertResponses)            // ← now populated
                .build();
    }
}