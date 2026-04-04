package com.supplychain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "historical_delays")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HistoricalDelay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String routeOrigin;

    @Column(nullable = false)
    private String routeDestination;

    private String carrier;

    // 1-12
    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Double avgDelayHours;

    @Column(nullable = false)
    private Integer delayCount;

    @Column(nullable = false)
    private Integer totalShipments;

    // Derived: delayCount / totalShipments
    private Double delayRate;
}
