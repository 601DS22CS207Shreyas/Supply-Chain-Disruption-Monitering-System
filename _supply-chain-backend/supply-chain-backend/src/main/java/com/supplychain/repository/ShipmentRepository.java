package com.supplychain.repository;

import com.supplychain.enums.ShipmentStatus;
import com.supplychain.enums.TransportMode;
import com.supplychain.model.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    // Filtered listing used by the dashboard
    Page<Shipment> findByStatus(ShipmentStatus status, Pageable pageable);

    Page<Shipment> findByTransportMode(TransportMode mode, Pageable pageable);

    // Free-text search across origin, destination, carrier, tracking number
    @Query("""
        SELECT s FROM Shipment s
        WHERE LOWER(s.origin) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(s.destination) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(s.carrier) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        """)
    Page<Shipment> searchShipments(@Param("q") String query, Pageable pageable);

    // For batch ML prediction: only active shipments
    List<Shipment> findByStatusIn(List<ShipmentStatus> statuses);

    // KPI: count by status
    long countByStatus(ShipmentStatus status);

    // Find shipments whose routes pass near a coordinate (approx bounding box)
    @Query("""
        SELECT s FROM Shipment s
        WHERE s.originLat BETWEEN :minLat AND :maxLat
          AND s.originLng BETWEEN :minLng AND :maxLng
          AND s.status IN ('PENDING', 'IN_TRANSIT', 'AT_WAREHOUSE')
        """)
    List<Shipment> findActiveShipmentsNearLocation(
            @Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng, @Param("maxLng") Double maxLng
    );
}

