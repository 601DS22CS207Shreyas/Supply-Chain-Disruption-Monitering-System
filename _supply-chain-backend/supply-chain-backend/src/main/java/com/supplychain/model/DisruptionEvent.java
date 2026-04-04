package com.supplychain.model;

import com.supplychain.enums.EventSeverity;
import com.supplychain.enums.EventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "disruption_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DisruptionEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventSeverity severity;

    @Column(nullable = false)
    private String location;        // Human-readable: "Chennai, Tamil Nadu"

    private Double lat;
    private Double lng;

    // Radius in km within which shipments are considered at risk
    private Double impactRadiusKm;

    @Column(nullable = false)
    private LocalDate eventDate;

    private String sourceUrl;       // Link to original news article
    private String sourceName;      // e.g. "Reuters", "Times of India"

    private Boolean isActive;       // Still ongoing?

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EventShipmentImpact> impactedShipments;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
