package com.supplychain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_routes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShipmentRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(nullable = false)
    private Integer waypointOrder;  // 1, 2, 3 ... (order of stops)

    @Column(nullable = false)
    private String city;

    private String country;

    private Double lat;
    private Double lng;

    private LocalDateTime estimatedArrival;
    private LocalDateTime actualArrival;
}
