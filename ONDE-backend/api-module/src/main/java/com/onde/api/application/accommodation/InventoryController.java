package com.onde.api.application.accommodation;

import com.onde.core.entity.reservation.ReservationTarget;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@Validated
@RestController
@RequestMapping({"/api/v1/inventory", "/api/inventory"})
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam @NotNull ReservationTarget targetType,
            @RequestParam @NotNull @Min(1) Long targetId,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ResponseEntity.ok(
                inventoryService.checkAvailability(targetType, targetId, startDate, endDate));
    }

    @GetMapping("/calendar")
    public ResponseEntity<Map<String, Object>> getCalendar(
            @RequestParam @NotNull ReservationTarget targetType,
            @RequestParam @NotNull @Min(1) Long targetId,
            @RequestParam @NotNull @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "month는 YYYY-MM 형식이어야 합니다.") String month) {

        return ResponseEntity.ok(inventoryService.getCalendar(targetType, targetId, month));
    }
}
