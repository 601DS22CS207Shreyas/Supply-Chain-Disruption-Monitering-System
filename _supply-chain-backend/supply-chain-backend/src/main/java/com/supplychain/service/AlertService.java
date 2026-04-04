package com.supplychain.service;

import com.supplychain.dto.response.AlertResponse;
import com.supplychain.enums.AlertType;
import com.supplychain.model.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AlertService {

    Page<AlertResponse> getAlerts(boolean unreadOnly, Pageable pageable);

    AlertResponse markAsRead(Long id);

    // Called internally by RiskPredictionService to auto-generate alerts
    void createAlert(Shipment shipment, AlertType type, String message, String severity);

    long getUnreadCount();
}
