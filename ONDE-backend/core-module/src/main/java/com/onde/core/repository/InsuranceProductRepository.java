package com.onde.core.repository;

import com.onde.core.entity.flight.ApprovalStatus;
import com.onde.core.entity.insurance.InsuranceProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsuranceProductRepository extends JpaRepository<InsuranceProduct, Long> {
    List<InsuranceProduct> findByStatus(ApprovalStatus status);
}
