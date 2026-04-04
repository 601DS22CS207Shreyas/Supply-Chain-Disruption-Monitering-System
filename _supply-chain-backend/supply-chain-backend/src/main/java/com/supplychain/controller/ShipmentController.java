package com.supplychain.controller;

import com.supplychain.dto.request.CreateShipmentRequest;
import com.supplychain.dto.request.UpdateShipmentStatusRequest;
import com.supplychain.dto.response.ShipmentDetailResponse;
import com.supplychain.dto.response.ShipmentResponse;
import com.supplychain.enums.ShipmentStatus;
import com.supplychain.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    // GET /api/shipments?search=&status=&page=0&size=10&sort=createdAt,desc
    @GetMapping
    public ResponseEntity<Page<ShipmentResponse>> getShipments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ShipmentStatus status,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(shipmentService.getShipments(search, status, pageable));
    }

    // GET /api/shipments/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ShipmentDetailResponse> getShipmentDetail(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getShipmentDetail(id));
    }

    // POST /api/shipments
    @PostMapping
    public ResponseEntity<ShipmentResponse> createShipment(@Valid @RequestBody CreateShipmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shipmentService.createShipment(req));
    }

    // PUT /api/shipments/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<ShipmentResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShipmentStatusRequest req) {
        return ResponseEntity.ok(shipmentService.updateStatus(id, req));
    }

    // DELETE /api/shipments/{id}  — ADMIN only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteShipment(@PathVariable Long id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.noContent().build();
    }
}
