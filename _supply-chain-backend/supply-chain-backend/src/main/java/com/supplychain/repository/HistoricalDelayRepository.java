package com.supplychain.repository;

import com.supplychain.model.HistoricalDelay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HistoricalDelayRepository extends JpaRepository<HistoricalDelay, Long> {

    Optional<HistoricalDelay> findByRouteOriginAndRouteDestinationAndCarrierAndMonth(
            String origin, String destination, String carrier, Integer month
    );

    // Used for the delay trends chart on Reports page
    @Query("SELECT h FROM HistoricalDelay h WHERE h.routeOrigin = :origin AND h.routeDestination = :dest ORDER BY h.month")
    List<HistoricalDelay> findByRouteOrderByMonth(
            @Param("origin") String origin,
            @Param("dest") String destination
    );
}
