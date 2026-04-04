package com.supplychain.service;

import com.supplychain.client.NewsApiClient;
import com.supplychain.dto.response.DisruptionEventResponse;
import com.supplychain.model.DisruptionEvent;
import com.supplychain.repository.DisruptionEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisruptionEventServiceImpl implements DisruptionEventService {

    private final DisruptionEventRepository eventRepository;
    private final NewsApiClient newsApiClient;

    // ── List events ───────────────────────────────────────────────────────────
    public Page<DisruptionEventResponse> getAllEvents(Pageable pageable) {
        return eventRepository.findAll(pageable).map(this::mapToResponse);
    }

    public List<DisruptionEventResponse> getActiveEvents() {
        return eventRepository.findByIsActiveTrue()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ── Scheduled fetch every 6 hours ─────────────────────────────────────────
    @Scheduled(cron = "${app.news-fetch.cron}")
    public void scheduledNewsFetch() {
        log.info("Scheduled disruption news fetch starting...");
        fetchAndStoreLatestNews();
    }

    // ── Manual trigger (via API endpoint) ─────────────────────────────────────
    public int fetchAndStoreLatestNews() {
        List<DisruptionEvent> fetched = newsApiClient.fetchDisruptionEvents();
        int newCount = 0;
        for (DisruptionEvent event : fetched) {
            if (event.getSourceUrl() != null && !eventRepository.existsBySourceUrl(event.getSourceUrl())) {
                eventRepository.save(event);
                newCount++;
            }
        }
        log.info("Fetched and stored {} new disruption events", newCount);
        return newCount;
    }

    // ── Find events near a route ───────────────────────────────────────────────
    public List<DisruptionEvent> findEventsNearLocation(Double lat, Double lng, Double radiusKm) {
        // Convert km radius to approximate lat/lng delta (1 degree ≈ 111 km)
        double delta = radiusKm / 111.0;
        return eventRepository.findActiveEventsNearLocation(lat - delta, lat + delta, lng - delta, lng + delta);
    }

    // ── Mapping helper ────────────────────────────────────────────────────────
    private DisruptionEventResponse mapToResponse(DisruptionEvent e) {
        return DisruptionEventResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .eventType(e.getEventType())
                .severity(e.getSeverity())
                .location(e.getLocation())
                .lat(e.getLat())
                .lng(e.getLng())
                .impactRadiusKm(e.getImpactRadiusKm())
                .eventDate(e.getEventDate())
                .sourceUrl(e.getSourceUrl())
                .sourceName(e.getSourceName())
                .isActive(e.getIsActive())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
