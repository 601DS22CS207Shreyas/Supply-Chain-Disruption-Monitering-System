package com.supplychain.repository;

import com.supplychain.model.EventShipmentImpact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventShipmentImpactRepository extends JpaRepository<EventShipmentImpact, Long> {

    List<EventShipmentImpact> findByShipmentId(Long shipmentId);

    List<EventShipmentImpact> findByEventId(Long eventId);

    boolean existsByEventIdAndShipmentId(Long eventId, Long shipmentId);
}
