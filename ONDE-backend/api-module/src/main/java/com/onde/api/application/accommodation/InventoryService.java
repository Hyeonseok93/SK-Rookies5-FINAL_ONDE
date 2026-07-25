package com.onde.api.application.accommodation;

import com.onde.core.entity.reservation.ReservationTarget;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final ReservationService reservationService;
    private final InventoryCalendarService inventoryCalendarService;

    public Map<String, Object> checkAvailability(
            ReservationTarget targetType, Long targetId, LocalDate startDate, LocalDate endDate) {
        boolean isAvailable = reservationService.checkAvailability(targetType, targetId, startDate, endDate);
        Map<String, Object> body = new HashMap<>();
        body.put("targetId", targetId);
        body.put("isAvailable", isAvailable);
        body.put("status", isAvailable ? "AVAILABLE" : "SOLD_OUT");
        return body;
    }

    public Map<String, Object> getCalendar(ReservationTarget targetType, Long targetId, String month) {
        Map<String, Map<String, Object>> response =
                inventoryCalendarService.getMonthCalendarAsMaps(targetType, targetId, month);
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", "재고 달력 조회가 완료되었습니다.");
        body.put("data", response);
        return body;
    }
}
