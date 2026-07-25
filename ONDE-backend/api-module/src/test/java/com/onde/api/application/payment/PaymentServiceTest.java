package com.onde.api.application.payment;

import com.onde.api.application.membergrade.MemberGradeService;
import com.onde.api.application.mileage.MileageService;
import com.onde.api.application.payment.dto.request.PaymentPrepareRequest;
import com.onde.api.application.payment.dto.request.PaymentValidateRequest;
import com.onde.core.entity.flight.FlightBooking;
import com.onde.core.entity.payment.Payment;
import com.onde.core.entity.payment.PaymentStatus;
import com.onde.core.exception.ForbiddenException;
import com.onde.core.repository.FlightBookingRepository;
import com.onde.core.repository.InsurancePolicyRepository;
import com.onde.core.repository.PaymentRepository;
import com.onde.core.repository.ReservationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private MileageService mileageService;
    @Mock
    private MemberGradeService memberGradeService;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private FlightBookingRepository flightBookingRepository;
    @Mock
    private InsurancePolicyRepository insurancePolicyRepository;
    @Mock
    private WalletService walletService;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    @DisplayName("prepare: 알 수 없는 예약 타입은 클라이언트 totalAmount로 폴백하지 않고 거부한다")
    void prepareRejectsUnknownTypeWithoutClientTotalFallback() {
        PaymentPrepareRequest req = prepareRequest(10L, "UNKNOWN", 100_000, 0);

        assertThatThrownBy(() -> paymentService.preparePayment(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("알 수 없는 예약 타입");

        verify(paymentRepository, never()).save(any());
        verify(walletService, never()).getBalance(any());
    }

    @Test
    @DisplayName("prepare: 예약 소유자가 아니면 PENDING을 생성하지 않는다")
    void prepareRejectsNonOwner() {
        FlightBooking booking = FlightBooking.builder()
                .id(10L)
                .userId(99L)
                .totalPrice(new BigDecimal("100000"))
                .build();
        when(flightBookingRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(booking));

        PaymentPrepareRequest req = prepareRequest(10L, "FLIGHT", 100_000, 0);

        assertThatThrownBy(() -> paymentService.preparePayment(1L, req))
                .isInstanceOf(ForbiddenException.class);

        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("validate: prepare에서 발급한 walletTxId와 다르면 거부한다")
    void validateRejectsMismatchedWalletTxId() {
        Payment payment = Payment.builder()
                .id(1L)
                .userId(1L)
                .merchantUid("ORDER-2026-abcd1234")
                .impUid("WALLET-serverissuedtxid")
                .pgAmount(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .usedMileage(0)
                .accumulatedMileage(0)
                .status(PaymentStatus.PENDING)
                .reservationType("FLIGHT")
                .reservationId(10L)
                .build();
        when(paymentRepository.findByMerchantUidForUpdate("ORDER-2026-abcd1234")).thenReturn(Optional.of(payment));

        PaymentValidateRequest req = new PaymentValidateRequest();
        req.setMerchantUid("ORDER-2026-abcd1234");
        req.setImpUid("WALLET-clientminted");
        req.setPgAmount(new BigDecimal("100000"));

        assertThatThrownBy(() -> paymentService.validatePayment(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("결제 거래 ID");

        verify(walletService, never()).deduct(any(), any(), any());
    }

    @Test
    @DisplayName("validate: 이미 PAID인 주문은 지갑 차감 전에 거부한다")
    void validateRejectsDoublePay() {
        Payment payment = Payment.builder()
                .id(1L)
                .userId(1L)
                .merchantUid("ORDER-2026-abcd1234")
                .impUid("WALLET-serverissuedtxid")
                .pgAmount(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .usedMileage(0)
                .accumulatedMileage(0)
                .status(PaymentStatus.PAID)
                .reservationType("FLIGHT")
                .reservationId(10L)
                .build();
        when(paymentRepository.findByMerchantUidForUpdate("ORDER-2026-abcd1234")).thenReturn(Optional.of(payment));

        PaymentValidateRequest req = new PaymentValidateRequest();
        req.setMerchantUid("ORDER-2026-abcd1234");
        req.setImpUid("WALLET-serverissuedtxid");
        req.setPgAmount(new BigDecimal("100000"));

        assertThatThrownBy(() -> paymentService.validatePayment(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 결제");

        verify(walletService, never()).deduct(any(), any(), any());
    }

    @Test
    @DisplayName("cancel: PENDING은 지갑 환불 없이 void 한다")
    void cancelPendingDoesNotRefund() {
        Payment payment = Payment.builder()
                .id(1L)
                .userId(1L)
                .merchantUid("ORDER-2026-abcd1234")
                .impUid("WALLET-serverissuedtxid")
                .pgAmount(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .usedMileage(0)
                .accumulatedMileage(0)
                .status(PaymentStatus.PENDING)
                .reservationType("FLIGHT")
                .reservationId(10L)
                .build();
        when(paymentRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(payment));
        FlightBooking booking = FlightBooking.builder()
                .id(10L)
                .userId(1L)
                .totalPrice(new BigDecimal("100000"))
                .build();
        when(flightBookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        com.onde.api.application.payment.dto.request.PaymentCancelRequest req =
                new com.onde.api.application.payment.dto.request.PaymentCancelRequest();
        req.setReason("user cancel");

        var res = paymentService.cancelPayment(1L, 1L, req);

        assertThat(res.getRefundedAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        verify(walletService, never()).refund(any(), any(), any());
    }

    @Test
    @DisplayName("cancel: PAID만 지갑 환불을 수행한다")
    void cancelPaidRefundsWallet() {
        Payment payment = Payment.builder()
                .id(1L)
                .userId(1L)
                .merchantUid("ORDER-2026-abcd1234")
                .impUid("WALLET-serverissuedtxid")
                .pgAmount(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .usedMileage(0)
                .accumulatedMileage(0)
                .status(PaymentStatus.PAID)
                .reservationType("FLIGHT")
                .reservationId(10L)
                .build();
        when(paymentRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(payment));
        FlightBooking booking = FlightBooking.builder()
                .id(10L)
                .userId(1L)
                .totalPrice(new BigDecimal("100000"))
                .build();
        when(flightBookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        com.onde.api.application.payment.dto.request.PaymentCancelRequest req =
                new com.onde.api.application.payment.dto.request.PaymentCancelRequest();
        req.setReason("user cancel");

        var res = paymentService.cancelPayment(1L, 1L, req);

        assertThat(res.getRefundedAmount()).isEqualByComparingTo(new BigDecimal("100000"));
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        verify(walletService).refund(1L, new BigDecimal("100000"), "user cancel");
    }

    @Test
    @DisplayName("cancel: 구매자가 아니면 환불하지 않는다")
    void cancelRejectsNonBuyer() {
        Payment payment = Payment.builder()
                .id(1L)
                .userId(1L)
                .pgAmount(new BigDecimal("100000"))
                .status(PaymentStatus.PAID)
                .reservationType("FLIGHT")
                .reservationId(10L)
                .build();
        when(paymentRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(payment));

        com.onde.api.application.payment.dto.request.PaymentCancelRequest req =
                new com.onde.api.application.payment.dto.request.PaymentCancelRequest();
        req.setReason("seller cancel");

        assertThatThrownBy(() -> paymentService.cancelPayment(99L, 1L, req))
                .isInstanceOf(ForbiddenException.class);

        verify(walletService, never()).refund(any(), any(), any());
    }

    @Test
    @DisplayName("prepare: 이미 PENDING이 있으면 거부한다")
    void prepareRejectsDuplicatePending() {
        FlightBooking booking = FlightBooking.builder()
                .id(10L)
                .userId(1L)
                .totalPrice(new BigDecimal("100000"))
                .build();
        when(flightBookingRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(booking));
        when(mileageService.getCurrentMileage(1L)).thenReturn(0);
        when(walletService.getBalance(1L)).thenReturn(new BigDecimal("100000"));
        when(paymentRepository.existsByReservationIdAndReservationTypeAndStatus(
                10L, "FLIGHT", PaymentStatus.PENDING)).thenReturn(true);

        PaymentPrepareRequest req = prepareRequest(10L, "FLIGHT", 100_000, 0);

        assertThatThrownBy(() -> paymentService.preparePayment(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PENDING");

        verify(paymentRepository, never()).save(any());
    }

    private static PaymentPrepareRequest prepareRequest(Long reservationId, String type, int total, int usedMileage) {
        PaymentPrepareRequest req = new PaymentPrepareRequest();
        req.setReservationId(reservationId);
        req.setReservationType(type);
        req.setUsedMileage(usedMileage);
        return req;
    }
}
