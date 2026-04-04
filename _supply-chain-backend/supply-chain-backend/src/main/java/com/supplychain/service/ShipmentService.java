package com.supplychain.service;

import com.supplychain.dto.request.CreateShipmentRequest;
import com.supplychain.dto.request.UpdateShipmentStatusRequest;
import com.supplychain.dto.response.ShipmentDetailResponse;
import com.supplychain.dto.response.ShipmentResponse;
import com.supplychain.enums.ShipmentStatus;
import com.supplychain.model.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ShipmentService {

    ShipmentResponse createShipment(CreateShipmentRequest req);

    Page<ShipmentResponse> getShipments(String search, ShipmentStatus status, Pageable pageable);

    ShipmentDetailResponse getShipmentDetail(Long id);

    // Used internally by RiskPredictionService — returns the raw entity
    Shipment getShipmentById(Long id);

    ShipmentResponse updateStatus(Long id, UpdateShipmentStatusRequest req);

    void deleteShipment(Long id);

    // Used by batch prediction — returns active shipments only
    List<Shipment> getActiveShipments();
}

