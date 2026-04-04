package com.supplychain.repository;

import com.supplychain.model.RiskPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RiskPredictionRepository extends JpaRepository<RiskPrediction, Long> {

    // Latest prediction for a shipment
    Optional<RiskPrediction> findTopByShipmentIdOrderByPredictedAtDesc(Long shipmentId);

    // All predictions for history chart
    List<RiskPrediction> findByShipmentIdOrderByPredictedAtAsc(Long shipmentId);

    // High-risk shipments for dashboard (threshold 0.7)
    @Query("SELECT rp FROM RiskPrediction rp WHERE rp.delayProbability >= :threshold " +
            "AND rp.predictedAt = (SELECT MAX(rp2.predictedAt) FROM RiskPrediction rp2 WHERE rp2.shipment = rp.shipment)")
    List<RiskPrediction> findLatestHighRiskPredictions(double threshold);

    // Average risk across all active shipments
    @Query("SELECT AVG(rp.delayProbability) FROM RiskPrediction rp " +
            "WHERE rp.predictedAt = (SELECT MAX(rp2.predictedAt) FROM RiskPrediction rp2 WHERE rp2.shipment = rp.shipment)")
    Double findAverageRiskScore();
}
