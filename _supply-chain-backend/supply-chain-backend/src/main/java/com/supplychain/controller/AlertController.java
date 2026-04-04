package com.supplychain.controller;

import com.supplychain.dto.response.AlertResponse;
import com.supplychain.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    // GET /api/alerts?unreadOnly=true&page=0&size=20
    @GetMapping
    public ResponseEntity<Page<AlertResponse>> getAlerts(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(alertService.getAlerts(unreadOnly, pageable));
    }

    // PUT /api/alerts/{id}/read
    @PutMapping("/{id}/read")
    public ResponseEntity<AlertResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.markAsRead(id));
    }
}