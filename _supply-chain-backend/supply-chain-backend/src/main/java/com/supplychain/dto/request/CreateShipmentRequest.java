package com.supplychain.dto.request;

import com.supplychain.enums.TransportMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateShipmentRequest {

    @NotBlank(message = "Origin is required")
    private String origin;

    @NotBlank(message = "Destination is required")
    private String destination;

    @NotBlank(message = "Carrier is required")
    private String carrier;

    @NotNull(message = "Transport mode is required")
    private TransportMode transportMode;

    private String cargoDescription;
    private Double cargoWeightKg;
    private Double cargoValueUsd;

    @NotNull(message = "Scheduled departure is required")
    private LocalDateTime scheduledDeparture;

    @NotNull(message = "Scheduled arrival is required")
    private LocalDateTime scheduledArrival;

    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;

    private List<WaypointRequest> waypoints;

    @Data
    public static class WaypointRequest {
        private Integer waypointOrder;
        private String city;
        private String country;
        private Double lat;
        private Double lng;
        private LocalDateTime estimatedArrival;
    }
}