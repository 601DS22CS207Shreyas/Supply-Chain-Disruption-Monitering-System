package com.supplychain.service;

import com.supplychain.dto.response.AlertResponse;
import com.supplychain.enums.AlertType;
import com.supplychain.exception.ResourceNotFoundException;
import com.supplychain.model.Alert;
import com.supplychain.model.Shipment;
import com.supplychain.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;

    public Page<AlertResponse> getAlerts(boolean unreadOnly, Pageable pageable) {
        Page<Alert> page = unreadOnly
                ? alertRepository.findByIsReadFalseOrderByCreatedAtDesc(pageable)
                : alertRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::mapToResponse);
    }

    @Transactional
    public AlertResponse markAsRead(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));
        alert.setIsRead(true);
        return mapToResponse(alertRepository.save(alert));
    }

    public void createAlert(Shipment shipment, AlertType type, String message, String severity) {
        Alert alert = Alert.builder()
                .shipment(shipment)
                .alertType(type)
                .message(message)
                .severity(severity)
                .isRead(false)
                .build();
        alertRepository.save(alert);
    }

    public long getUnreadCount() {
        return alertRepository.countByIsReadFalse();
    }

    private AlertResponse mapToResponse(Alert a) {
        return AlertResponse.builder()
                .id(a.getId())
                .shipmentId(a.getShipment().getId())
                .trackingNumber(a.getShipment().getTrackingNumber())
                .alertType(a.getAlertType())
                .message(a.getMessage())
                .severity(a.getSeverity())
                .isRead(a.getIsRead())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

