package com.supplychain.controller;

import com.supplychain.dto.response.RiskPredictionResponse;
import com.supplychain.service.RiskPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    private final RiskPredictionService riskPredictionService;

    // GET /api/risk/{shipmentId}  — get latest prediction
    @GetMapping("/{shipmentId}")
    public ResponseEntity<RiskPredictionResponse> getLatestPrediction(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(riskPredictionService.getLatestPrediction(shipmentId));
    }

    // POST /api/risk/predict/{shipmentId}  — run fresh prediction
    @PostMapping("/predict/{shipmentId}")
    public ResponseEntity<RiskPredictionResponse> predictForShipment(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(riskPredictionService.predictForShipment(shipmentId));
    }

    // POST /api/risk/predict-all  — batch predict all active shipments (ADMIN)
    @PostMapping("/predict-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RiskPredictionResponse>> predictAll() {
        return ResponseEntity.ok(riskPredictionService.predictAll());
    }
}