package com.supplychain.repository;

import com.supplychain.model.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    Page<Alert> findByIsReadFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Alert> findByShipmentIdOrderByCreatedAtDesc(Long shipmentId);

    long countByIsReadFalse();
}
