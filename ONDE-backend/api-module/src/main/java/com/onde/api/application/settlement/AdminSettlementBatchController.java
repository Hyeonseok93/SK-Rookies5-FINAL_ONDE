package com.onde.api.application.settlement;

import com.onde.core.support.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * 어드민 정산 배치 수동 트리거.
 * (스케줄러와 HTTP를 분리해 api-module 내 책임을 나눕니다.)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/settlements")
@RequiredArgsConstructor
public class AdminSettlementBatchController {

    private final SettlementService settlementService;

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SELLER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerSettlement(
            @RequestParam(name = "date", required = false) String date) {

        LocalDate targetDate = (date != null && !date.isBlank())
                ? LocalDate.parse(date)
                : LocalDate.now().minusDays(1);

        log.info("[수동 트리거] 정산 배치 강제 실행 요청. (대상 일자: {})", targetDate);

        try {
            settlementService.executeDailySettlement(targetDate);
            log.info("[수동 트리거] 정산 배치 완료. (대상 일자: {})", targetDate);
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("targetDate", targetDate.toString(), "status", "SUCCESS"),
                    targetDate + " 정산 배치가 성공적으로 실행되었습니다."
            ));
        } catch (Exception e) {
            log.error("[수동 트리거] 정산 배치 실행 중 오류. (대상 일자: {})", targetDate, e);
            return ResponseEntity.internalServerError().body(
                    ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .data(Map.of("targetDate", targetDate.toString(), "status", "ERROR"))
                            .message("정산 배치 실행 중 오류가 발생했습니다.")
                            .timestamp(ZonedDateTime.now(ZoneId.of("UTC")).format(DateTimeFormatter.ISO_INSTANT))
                            .build()
            );
        }
    }
}
