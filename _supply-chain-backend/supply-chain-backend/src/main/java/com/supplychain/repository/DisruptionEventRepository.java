package com.supplychain.repository;

import com.supplychain.enums.EventSeverity;
import com.supplychain.enums.EventType;
import com.supplychain.model.DisruptionEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DisruptionEventRepository extends JpaRepository<DisruptionEvent, Long> {

    Page<DisruptionEvent> findByEventType(EventType eventType, Pageable pageable);

    Page<DisruptionEvent> findBySeverity(EventSeverity severity, Pageable pageable);

    List<DisruptionEvent> findByIsActiveTrue();

    // Used to avoid duplicate news ingestion
    boolean existsBySourceUrl(String sourceUrl);

    // Find events within a date range for dashboard
    List<DisruptionEvent> findByEventDateBetween(LocalDate from, LocalDate to);

    // Find events near a lat/lng bounding box
    @Query("""
        SELECT e FROM DisruptionEvent e
        WHERE e.lat BETWEEN :minLat AND :maxLat
          AND e.lng BETWEEN :minLng AND :maxLng
          AND e.isActive = true
        """)
    List<DisruptionEvent> findActiveEventsNearLocation(
            @Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng, @Param("maxLng") Double maxLng
    );

    long countBySeverity(EventSeverity severity);
}
