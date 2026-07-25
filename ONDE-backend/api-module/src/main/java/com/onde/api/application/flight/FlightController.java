package com.onde.api.application.flight;

import com.onde.api.application.flight.dto.FlightBookingRequest;
import com.onde.api.application.flight.dto.FlightBookingResponse;
import com.onde.api.application.flight.dto.FlightSearchRequest;
import com.onde.api.application.flight.dto.FlightSearchResponse;
import com.onde.api.config.DistributedLockExecutor;
import com.onde.api.security.LoginMember;
import com.onde.core.support.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.onde.api.application.flight.dto.FlightPaymentConfirmRequest;
import com.onde.core.validation.ValidationLimits;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;

@Validated
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;
    private final DistributedLockExecutor distributedLockExecutor;

    @GetMapping("/flights/search")
    public ResponseEntity<ApiResponse<FlightSearchResponse>> searchFlights(@Valid @ModelAttribute FlightSearchRequest req) {
        FlightSearchResponse response = flightService.searchFlights(req);
        return ResponseEntity.ok(ApiResponse.success(response, "항공편 검색 성공"));
    }

    /**
     * Redisson 분산 락 실행기(DistributedLockExecutor)를 활용한 동시성 방어 예약 진입
     */
    @PostMapping("/reservations/flights")
    public ResponseEntity<ApiResponse<FlightBookingResponse>> bookSeat(
            @Valid @RequestBody FlightBookingRequest req,
            @LoginMember Long userId) {
        String lockKey = "flight:lock:" + req.getScheduleId() + ":" + req.getSeatClass().name();

        // Redisson 분산 락 획득 시도 (대기 5초, 점유 10초) 및 비즈니스 콜백 격리 트랜잭션 실행
        FlightBookingResponse response = distributedLockExecutor.executeWithLock(lockKey, 5, 10, () -> {
            return flightService.bookSeat(req, userId);
        });

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "선택하신 좌석이 분산 락 제어 하에 10분간 안전하게 선점되었습니다."));
    }

    /**
     * 항공 예약 결제 확정 확인 (PaymentService.validate 이후 idempotent 확인)
     */
    @PostMapping("/reservations/flights/{booking_code}/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmPayment(
            @PathVariable("booking_code") @Size(max = ValidationLimits.BOOKING_CODE_MAX) String bookingCode,
            @Valid @RequestBody FlightPaymentConfirmRequest paymentPayload,
            @LoginMember Long userId) {
        log.info("Payment confirmation request received for bookingCode: {}", bookingCode);

        flightService.confirmBooking(bookingCode, userId, paymentPayload.getPaymentAmount());

        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "bookingCode", bookingCode,
                        "status", "CONFIRMED",
                        "pgTransactionId", paymentPayload.getPgTransactionId()),
                "결제 승인 및 예약 확정이 최종 완료되었습니다."));
    }
}
