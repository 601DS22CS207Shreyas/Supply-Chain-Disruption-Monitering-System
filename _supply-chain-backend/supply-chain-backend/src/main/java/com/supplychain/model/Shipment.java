package com.supplychain.model;

import com.supplychain.enums.ShipmentStatus;
import com.supplychain.enums.TransportMode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "shipments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String trackingNumber;  // e.g. SC-2024-001

    @Column(nullable = false)
    private String origin;          // e.g. "Chennai, India"

    @Column(nullable = false)
    private String destination;     // e.g. "Mumbai, India"

    @Column(nullable = false)
    private String carrier;         // e.g. "Blue Dart", "Maersk"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportMode transportMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    private String cargoDescription;    // e.g. "Electronic components"
    private Double cargoWeightKg;
    private Double cargoValueUsd;

    @Column(nullable = false)
    private LocalDateTime scheduledDeparture;

    @Column(nullable = false)
    private LocalDateTime scheduledArrival;

    private LocalDateTime actualDeparture;
    private LocalDateTime actualArrival;

    // Origin coordinates (for proximity matching with events)
    private Double originLat;
    private Double originLng;

    // Destination coordinates
    private Double destinationLat;
    private Double destinationLng;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ShipmentRoute> routeWaypoints;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RiskPrediction> riskPredictions;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Alert> alerts;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
