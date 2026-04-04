package com.supplychain.dto.request;

import com.supplychain.enums.ShipmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateShipmentStatusRequest {

    @NotNull(message = "Status is required")
    private ShipmentStatus status;

    private LocalDateTime actualDeparture;
    private LocalDateTime actualArrival;
}