package com.supplychain.service;

import com.supplychain.dto.response.DashboardSummaryResponse;
import com.supplychain.enums.EventSeverity;
import com.supplychain.enums.ShipmentStatus;
import com.supplychain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ShipmentRepository shipmentRepository;
    private final DisruptionEventRepository eventRepository;
    private final RiskPredictionRepository riskPredictionRepository;
    private final AlertRepository alertRepository;

    public DashboardSummaryResponse getSummary() {
        long total = shipmentRepository.count();
        long inTransit = shipmentRepository.countByStatus(ShipmentStatus.IN_TRANSIT);
        long delayed = shipmentRepository.countByStatus(ShipmentStatus.DELAYED);
        long delivered = shipmentRepository.countByStatus(ShipmentStatus.DELIVERED);
        long pending = shipmentRepository.countByStatus(ShipmentStatus.PENDING);

        Double avgRisk = riskPredictionRepository.findAverageRiskScore();
        long highRisk = riskPredictionRepository.findLatestHighRiskPredictions(0.7).size();
        long criticalRisk = riskPredictionRepository.findLatestHighRiskPredictions(0.9).size();

        long activeEvents = eventRepository.findByIsActiveTrue().size();
        long criticalEvents = eventRepository.countBySeverity(EventSeverity.CRITICAL);
        long unreadAlerts = alertRepository.countByIsReadFalse();

        return DashboardSummaryResponse.builder()
                .totalShipments(total)
                .inTransitCount(inTransit)
                .delayedCount(delayed)
                .deliveredCount(delivered)
                .pendingCount(pending)
                .averageRiskScore(avgRisk != null ? Math.round(avgRisk * 100.0) / 100.0 : 0.0)
                .highRiskCount(highRisk)
                .criticalRiskCount(criticalRisk)
                .activeDisruptionEvents(activeEvents)
                .criticalDisruptionEvents(criticalEvents)
                .unreadAlertsCount(unreadAlerts)
                .build();
    }
}
