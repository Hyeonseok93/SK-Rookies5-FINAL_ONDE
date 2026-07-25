package com.onde.admin.application.accommodation;

import com.onde.admin.application.accommodation.dto.AdminAccommodationStatusRequest;
import com.onde.admin.application.accommodation.dto.AdminAccommodationStatusResponse;
import com.onde.admin.application.accommodation.dto.AdminPendingPropertiesResponse;
import com.onde.admin.application.booking.AdminBookingService;
import com.onde.admin.application.booking.dto.AdminBookingSearchRequest;
import com.onde.admin.application.booking.dto.AdminBookingSearchResponse;
import com.onde.core.entity.accommodation.ApprovalStatus;
import com.onde.core.support.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/accommodations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SELLER_ADMIN', 'USER_ADMIN', 'SUPER_ADMIN')")
public class AdminAccommodationController {

    private final AdminAccommodationService adminAccommodationService;
    private final AdminBookingService adminBookingService;

    /**
     * 숙소, 렌터카 전체 예약 내역 조회
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<AdminBookingSearchResponse>> searchBookings(
            @ModelAttribute AdminBookingSearchRequest request) {

        AdminBookingSearchResponse response = adminBookingService.searchBookings(request);
        return ResponseEntity.ok(ApiResponse.success(response, "예약 내역 조회가 완료되었습니다."));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<AdminPendingPropertiesResponse>> getPendingAccommodations(
            @RequestParam(value = "type", required = false) String type) {
        AdminPendingPropertiesResponse response = adminAccommodationService.getPendingProperties(type);
        return ResponseEntity.ok(ApiResponse.success(response, "대기 중인 매물 목록을 조회했습니다."));
    }

    /**
     * 매물 승인/반려
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminAccommodationStatusResponse>> updateAccommodationStatus(
            @PathVariable Long id,
            @RequestBody AdminAccommodationStatusRequest request) {

        AdminAccommodationStatusResponse response =
                adminAccommodationService.updateAccommodationStatus(id, request);
        String message = request.approvalStatus() == ApprovalStatus.APPROVED
                ? "매물이 승인되었습니다."
                : "매물이 반려되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(response, message));
    }
}
