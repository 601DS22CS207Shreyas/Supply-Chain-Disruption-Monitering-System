package com.supplychain.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class DashboardSummaryResponse {
    // Shipment counts
    private long totalShipments;
    private long inTransitCount;
    private long delayedCount;
    private long deliveredCount;
    private long pendingCount;

    // Risk overview
    private Double averageRiskScore;
    private long highRiskCount;        // risk >= 0.7
    private long criticalRiskCount;    // risk >= 0.9

    // Disruptions
    private long activeDisruptionEvents;
    private long criticalDisruptionEvents;

    // Alerts
    private long unreadAlertsCount;
}