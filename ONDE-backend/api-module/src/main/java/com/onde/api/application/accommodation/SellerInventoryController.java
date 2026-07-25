package com.onde.api.application.accommodation;

import com.onde.api.security.LoginMember;
import com.onde.core.support.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 판매자용 숙소/렌터카 일별 재고 및 가격 제어를 담당하는 컨트롤러입니다.
 */
@Validated
@RestController
@RequestMapping("/api/v1/seller/inventory")
@RequiredArgsConstructor
public class SellerInventoryController {

    private final SellerInventoryService sellerInventoryService;

    /**
     * 특정 상품(숙소 객실 또는 차량)의 월별 재고 및 가격 달력 데이터를 조회합니다.
     *
     * @param propertyKey 매물 키 (예: stay-1, car-2 등)
     * @param monthStr 조회 연월 (예: 2026-05)
     * @return 1일부터 마지막 날까지의 일별 재고, 가격, 예약 마감 상태 정보
     */
    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<Map<String, InventoryCalendarService.CalendarDayInfo>>> getCalendar(
            @LoginMember Long sellerId,
            @RequestParam("propertyKey")
            @NotBlank(message = "propertyKey는 필수입니다.")
            @Pattern(regexp = "^(stay|car)-\\d+$", message = "propertyKey 형식이 올바르지 않습니다.")
            String propertyKey,
            @RequestParam("month")
            @NotBlank(message = "month는 필수입니다.")
            @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "month는 YYYY-MM 형식이어야 합니다.")
            String monthStr) {

        Map<String, InventoryCalendarService.CalendarDayInfo> response =
                sellerInventoryService.getCalendar(sellerId, propertyKey, monthStr);
        return ResponseEntity.ok(ApiResponse.success(response, "재고 달력 조회가 완료되었습니다."));
    }

    /**
     * 특정 상품의 하루치 재고 및 가격 설정을 업데이트하거나 새로 생성합니다.
     *
     * @param request 달력 업데이트 정보 DTO
     * @return 성공 여부
     */
    @PatchMapping("/calendar")
    public ResponseEntity<ApiResponse<Void>> updateCalendar(
            @LoginMember Long sellerId,
            @Valid @RequestBody SellerInventoryService.CalendarUpdateRequest request) {
        sellerInventoryService.updateCalendar(sellerId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "달력 재고 및 금액이 성공적으로 변경되었습니다."));
    }
}
