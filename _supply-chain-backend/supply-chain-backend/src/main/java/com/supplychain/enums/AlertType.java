package com.supplychain.enums;

public enum AlertType {
    HIGH_RISK_SHIPMENT,     // Risk score >= 0.7
    CRITICAL_RISK_SHIPMENT, // Risk score >= 0.9
    SHIPMENT_DELAYED,       // Status changed to DELAYED
    DISRUPTION_NEAR_ROUTE,  // New event detected near active route
    DELIVERY_OVERDUE        // Past scheduled arrival, not delivered
}
