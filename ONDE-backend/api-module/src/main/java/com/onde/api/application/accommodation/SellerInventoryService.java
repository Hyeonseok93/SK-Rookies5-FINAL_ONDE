package com.onde.api.application.accommodation;

import com.onde.api.application.accommodation.support.SellerPropertyOwnershipService;
import com.onde.core.entity.accommodation.Inventory;
import com.onde.core.entity.reservation.ReservationTarget;
import com.onde.core.repository.InventoryRepository;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SellerInventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryCalendarService inventoryCalendarService;
    private final SellerPropertyOwnershipService sellerPropertyOwnershipService;

    @Transactional(readOnly = true)
    public Map<String, InventoryCalendarService.CalendarDayInfo> getCalendar(
            Long sellerId, String propertyKey, String monthStr) {
        sellerPropertyOwnershipService.assertSellerOwnsProperty(sellerId, propertyKey);

        ReservationTarget targetType = parseTargetType(propertyKey);
        Long targetId = parseTargetId(propertyKey);
        return inventoryCalendarService.getMonthCalendar(targetType, targetId, monthStr);
    }

    @Transactional
    public void updateCalendar(Long sellerId, CalendarUpdateRequest request) {
        sellerPropertyOwnershipService.assertSellerOwnsProperty(sellerId, request.getPropertyKey());

        ReservationTarget targetType = parseTargetType(request.getPropertyKey());
        Long targetId = parseTargetId(request.getPropertyKey());

        String monthStr = request.getMonth() != null ? request.getMonth() : "2026-05";
        YearMonth ym = YearMonth.parse(monthStr, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDate date = ym.atDay(request.getDay());

        Optional<Inventory> opt = inventoryRepository.findByTargetTypeAndTargetIdAndDate(targetType, targetId, date);
        Inventory inventory;
        if (opt.isPresent()) {
            inventory = opt.get();
        } else {
            inventory = new Inventory();
            inventory.setTargetType(targetType);
            inventory.setTargetId(targetId);
            inventory.setDate(date);
        }

        if (request.getStock() != null) {
            inventory.setStock(request.getStock());
        }
        if (request.getPrice() != null) {
            inventory.setBasePrice(BigDecimal.valueOf(request.getPrice()));
        }

        inventoryRepository.save(inventory);
    }

    private ReservationTarget parseTargetType(String propertyKey) {
        if (propertyKey == null) {
            throw new IllegalArgumentException("propertyKey cannot be null");
        }
        String lower = propertyKey.toLowerCase();
        if (lower.startsWith("stay") || lower.startsWith("room")) {
            return ReservationTarget.ROOM;
        } else if (lower.startsWith("car")) {
            return ReservationTarget.CAR;
        }
        throw new IllegalArgumentException("Unknown propertyKey prefix: " + propertyKey);
    }

    private Long parseTargetId(String propertyKey) {
        if (propertyKey == null || !propertyKey.contains("-")) {
            throw new IllegalArgumentException("Invalid propertyKey format");
        }
        String[] parts = propertyKey.split("-");
        return Long.parseLong(parts[1]);
    }

    /**
     * 달력 정보 수정 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CalendarUpdateRequest {

        @NotBlank(message = "propertyKey는 필수입니다.")
        @Pattern(regexp = "^(stay|car)-\\d+$", message = "propertyKey 형식이 올바르지 않습니다.")
        private String propertyKey;

        @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "month는 YYYY-MM 형식이어야 합니다.")
        private String month;

        @NotNull(message = "day는 필수입니다.")
        @Min(value = 1, message = "day는 1~31 사이여야 합니다.")
        @Max(value = 31, message = "day는 1~31 사이여야 합니다.")
        private Integer day;

        @Min(value = 0, message = "재고는 0 이상이어야 합니다.")
        @Max(value = 9999, message = "재고가 허용 범위를 초과합니다.")
        private Integer stock;

        @Min(value = 0, message = "가격은 0원 이상이어야 합니다.")
        @Max(value = 999999999, message = "가격이 허용 범위를 초과합니다.")
        private Long price;
    }
}
