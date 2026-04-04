package com.supplychain.service;

import com.supplychain.dto.response.DisruptionEventResponse;
import com.supplychain.model.DisruptionEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DisruptionEventService {

    Page<DisruptionEventResponse> getAllEvents(Pageable pageable);

    List<DisruptionEventResponse> getActiveEvents();

    // Manually triggered via API endpoint — returns count of new events saved
    int fetchAndStoreLatestNews();

    // Used internally by RiskPredictionService to find events near a shipment route
    List<DisruptionEvent> findEventsNearLocation(Double lat, Double lng, Double radiusKm);
}

