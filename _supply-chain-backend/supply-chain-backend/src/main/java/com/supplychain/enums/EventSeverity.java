package com.supplychain.enums;

public enum EventSeverity {
    LOW,        // Minor impact, unlikely to affect shipments
    MEDIUM,     // Moderate impact, monitor closely
    HIGH,       // Significant impact, proactive action needed
    CRITICAL    // Severe disruption, immediate rerouting required
}
