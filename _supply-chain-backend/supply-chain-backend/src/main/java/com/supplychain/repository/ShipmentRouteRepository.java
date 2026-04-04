package com.supplychain.repository;

import com.supplychain.model.ShipmentRoute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentRouteRepository extends JpaRepository<ShipmentRoute, Long> {

    List<ShipmentRoute> findByShipmentIdOrderByWaypointOrder(Long shipmentId);
}