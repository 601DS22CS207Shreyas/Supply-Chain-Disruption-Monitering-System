package com.supplychain.dto.response;

import com.supplychain.enums.EventSeverity;
import com.supplychain.enums.EventType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder
public class DisruptionEventResponse {
    private Long id;
    private String title;
    private String description;
    private EventType eventType;
    private EventSeverity severity;
    private String location;
    private Double lat;
    private Double lng;
    private Double impactRadiusKm;
    private LocalDate eventDate;
    private String sourceUrl;
    private String sourceName;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
