package com.supplychain.service;

import com.supplychain.dto.response.RiskPredictionResponse;

import java.util.List;

public interface RiskPredictionService {

    // Run a fresh prediction for a single shipment and save the result
    RiskPredictionResponse predictForShipment(Long shipmentId);

    // Run predictions for all active (PENDING, IN_TRANSIT, AT_WAREHOUSE) shipments
    List<RiskPredictionResponse> predictAll();

    // Fetch the most recent saved prediction for a shipment
    RiskPredictionResponse getLatestPrediction(Long shipmentId);
}
