package com.onde.core.repository;

import com.onde.core.entity.flight.FlightRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlightRouteRepository extends JpaRepository<FlightRoute, Long> {
    List<FlightRoute> findBySellerId(Long sellerId);
}
