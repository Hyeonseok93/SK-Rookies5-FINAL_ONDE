package com.onde.api.application.accommodation;

import com.onde.core.entity.accommodation.Inventory;
import com.onde.core.entity.reservation.ReservationTarget;
import com.onde.core.repository.InventoryRepository;
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shared month-calendar builder for public and seller inventory endpoints.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryCalendarService {

    private final InventoryRepository inventoryRepository;

    public Map<String, CalendarDayInfo> getMonthCalendar(
            ReservationTarget targetType, Long targetId, String monthStr) {
        YearMonth ym = YearMonth.parse(monthStr, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        List<Inventory> dbInventories = inventoryRepository.findByTargetTypeAndTargetIdAndDateBetween(
                targetType, targetId, startDate, endDate);

        Map<LocalDate, Inventory> dbMap = new HashMap<>();
        for (Inventory inv : dbInventories) {
            dbMap.put(inv.getDate(), inv);
        }

        Map<String, CalendarDayInfo> response = new LinkedHashMap<>();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            LocalDate date = ym.atDay(d);
            Inventory inv = dbMap.get(date);
            String dayKey = String.valueOf(d);

            if (inv != null) {
                boolean isClosed = inv.getStock() == null || inv.getStock() <= 0;
                response.put(dayKey, CalendarDayInfo.builder()
                        .stock(inv.getStock() != null ? inv.getStock() : 0)
                        .price(inv.getBasePrice() != null ? inv.getBasePrice().longValue() : 0L)
                        .isClosed(isClosed)
                        .build());
            } else {
                response.put(dayKey, CalendarDayInfo.builder()
                        .stock(0)
                        .price(0L)
                        .isClosed(true)
                        .build());
            }
        }
        return response;
    }

    /**
     * Same calendar data as {@link #getMonthCalendar} but as plain maps for the public API shape.
     */
    public Map<String, Map<String, Object>> getMonthCalendarAsMaps(
            ReservationTarget targetType, Long targetId, String monthStr) {
        Map<String, CalendarDayInfo> days = getMonthCalendar(targetType, targetId, monthStr);
        Map<String, Map<String, Object>> response = new LinkedHashMap<>();
        for (Map.Entry<String, CalendarDayInfo> entry : days.entrySet()) {
            CalendarDayInfo info = entry.getValue();
            Map<String, Object> dayInfo = new HashMap<>();
            dayInfo.put("stock", info.getStock());
            dayInfo.put("price", info.getPrice());
            dayInfo.put("isClosed", info.getIsClosed());
            response.put(entry.getKey(), dayInfo);
        }
        return response;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CalendarDayInfo {
        private Integer stock;
        private Long price;
        private Boolean isClosed;
    }
}
