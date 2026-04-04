package com.supplychain.enums;

public enum ShipmentStatus {
    PENDING,        // Not yet dispatched
    IN_TRANSIT,     // Currently moving
    AT_WAREHOUSE,   // Held at intermediate warehouse
    DELAYED,        // Officially marked delayed
    DELIVERED,      // Successfully delivered
    CANCELLED       // Cancelled shipment
}
