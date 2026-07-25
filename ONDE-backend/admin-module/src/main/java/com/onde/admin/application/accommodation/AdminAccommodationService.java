package com.onde.admin.application.accommodation;

import com.onde.admin.application.accommodation.dto.AdminAccommodationStatusRequest;
import com.onde.admin.application.accommodation.dto.AdminAccommodationStatusResponse;
import com.onde.admin.application.accommodation.dto.AdminPendingPropertiesResponse;
import com.onde.admin.application.accommodation.dto.PendingPropertyItem;
import com.onde.core.entity.accommodation.Accommodation;
import com.onde.core.entity.accommodation.ApprovalStatus;
import com.onde.core.repository.AccommodationRepository;
import com.onde.core.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAccommodationService {

    private final AccommodationRepository accommodationRepository;
    private final CarRepository carRepository;

    @Transactional(readOnly = true)
    public AdminPendingPropertiesResponse getPendingProperties(String type) {
        List<PendingPropertyItem> items = new ArrayList<>();
        boolean includeAccommodations = type == null || type.isBlank() || type.equalsIgnoreCase("ACCOMMODATION");
        boolean includeCars = type == null || type.isBlank() || type.equalsIgnoreCase("CAR");

        if (includeAccommodations) {
            accommodationRepository.findByApprovalStatus(ApprovalStatus.PENDING).stream()
                    .map(accommodation -> new PendingPropertyItem(
                            accommodation.getId(),
                            "ACCOMMODATION",
                            accommodation.getName(),
                            accommodation.getApprovalStatus().name(),
                            accommodation.getSellerId()))
                    .forEach(items::add);
        }
        if (includeCars) {
            carRepository.findByApprovalStatus(ApprovalStatus.PENDING).stream()
                    .map(car -> new PendingPropertyItem(
                            car.getId(),
                            "CAR",
                            car.getModelName(),
                            car.getApprovalStatus().name(),
                            car.getSellerId()))
                    .forEach(items::add);
        }

        return new AdminPendingPropertiesResponse(items, items.size());
    }

    @Transactional
    public AdminAccommodationStatusResponse updateAccommodationStatus(
            Long id, AdminAccommodationStatusRequest request) {
        Accommodation accommodation = accommodationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Accommodation not found"));

        accommodation.setApprovalStatus(request.approvalStatus());
        accommodationRepository.save(accommodation);

        return new AdminAccommodationStatusResponse(
                accommodation.getId(),
                accommodation.getApprovalStatus(),
                LocalDateTime.now());
    }
}
