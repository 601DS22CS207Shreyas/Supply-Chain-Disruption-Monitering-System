package com.supplychain.dto.response;


import com.supplychain.enums.AlertType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class AlertResponse {
    private Long id;
    private Long shipmentId;
    private String trackingNumber;
    private AlertType alertType;
    private String message;
    private String severity;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
