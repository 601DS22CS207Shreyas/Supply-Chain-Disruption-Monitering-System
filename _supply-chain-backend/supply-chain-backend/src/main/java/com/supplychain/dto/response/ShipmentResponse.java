package com.supplychain.dto.response;

import com.supplychain.enums.ShipmentStatus;
import com.supplychain.enums.TransportMode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class ShipmentResponse {
    private Long id;
    private String trackingNumber;
    private String origin;
    private String destination;
    private String carrier;
    private TransportMode transportMode;
    private ShipmentStatus status;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime actualArrival;

    // Risk info (from latest prediction)
    private Double latestRiskScore;     // null if not yet predicted
    private String riskLevel;           // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    private LocalDateTime createdAt;
}