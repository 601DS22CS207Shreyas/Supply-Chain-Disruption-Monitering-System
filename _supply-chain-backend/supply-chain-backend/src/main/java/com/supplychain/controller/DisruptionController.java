package com.supplychain.controller;

import com.supplychain.dto.response.DisruptionEventResponse;
import com.supplychain.service.DisruptionEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disruptions")
@RequiredArgsConstructor
public class DisruptionController {

    private final DisruptionEventService disruptionEventService;

    // GET /api/disruptions?page=0&size=20
    @GetMapping
    public ResponseEntity<Page<DisruptionEventResponse>> getAllEvents(
            @PageableDefault(size = 20, sort = "eventDate") Pageable pageable) {
        return ResponseEntity.ok(disruptionEventService.getAllEvents(pageable));
    }

    // GET /api/disruptions/active
    @GetMapping("/active")
    public ResponseEntity<List<DisruptionEventResponse>> getActiveEvents() {
        return ResponseEntity.ok(disruptionEventService.getActiveEvents());
    }

    // POST /api/disruptions/fetch-latest  — triggers NewsAPI fetch manually
    @PostMapping("/fetch-latest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> fetchLatestNews() {
        int newEvents = disruptionEventService.fetchAndStoreLatestNews();
        return ResponseEntity.ok(Map.of(
                "message", "News fetch completed",
                "newEventsAdded", newEvents
        ));
    }
}

