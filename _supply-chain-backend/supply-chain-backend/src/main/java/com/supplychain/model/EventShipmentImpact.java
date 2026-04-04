package com.supplychain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_shipment_impact")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventShipmentImpact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private DisruptionEvent event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    // 0.0 - 1.0: how much this event contributes to delay risk for this shipment
    @Column(nullable = false)
    private Double impactScore;

    // Distance in km between event epicenter and shipment route
    private Double distanceFromRouteKm;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
