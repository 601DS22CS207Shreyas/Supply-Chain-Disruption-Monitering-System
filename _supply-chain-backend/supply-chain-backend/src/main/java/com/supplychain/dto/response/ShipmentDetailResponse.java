package com.supplychain.dto.response;

import com.supplychain.enums.ShipmentStatus;
import com.supplychain.enums.TransportMode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class ShipmentDetailResponse {
    private Long id;
    private String trackingNumber;
    private String origin;
    private String destination;
    private String carrier;
    private TransportMode transportMode;
    private ShipmentStatus status;
    private String cargoDescription;
    private Double cargoWeightKg;
    private Double cargoValueUsd;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime actualDeparture;
    private LocalDateTime actualArrival;
    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;

    private List<WaypointResponse> waypoints;
    private RiskPredictionResponse latestPrediction;
    private List<AlertResponse> recentAlerts;

    @Data @Builder
    public static class WaypointResponse {
        private Integer waypointOrder;
        private String city;
        private String country;
        private Double lat;
        private Double lng;
        private LocalDateTime estimatedArrival;
        private LocalDateTime actualArrival;
    }
}
