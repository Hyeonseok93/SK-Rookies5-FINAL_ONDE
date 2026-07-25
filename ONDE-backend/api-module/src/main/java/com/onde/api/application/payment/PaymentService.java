package com.onde.api.application.payment;

import com.onde.api.application.payment.dto.request.*;
import com.onde.api.application.payment.dto.response.*;
import com.onde.api.application.mileage.MileageService;
import com.onde.api.application.membergrade.MemberGradeService;
import com.onde.core.entity.payment.MileageLogType;
import com.onde.core.entity.payment.Payment;
import com.onde.core.entity.payment.PaymentStatus;
import com.onde.core.entity.flight.BookingStatus;
import com.onde.core.entity.flight.FlightBooking;
import com.onde.core.entity.insurance.InsurancePolicy;
import com.onde.core.entity.insurance.InsurancePolicyStatus;
import com.onde.core.entity.reservation.Reservation;
import com.onde.core.entity.reservation.ReservationStatus;
import com.onde.core.repository.FlightBookingRepository;
import com.onde.core.repository.InsurancePolicyRepository;
import com.onde.core.repository.PaymentRepository;
import com.onde.core.repository.ReservationRepository;
import com.onde.core.exception.ErrorCode;
import com.onde.core.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.event.EventListener;
import com.onde.core.event.AdminBookingCancelEvent;

/**
 * 결제 서비스 클래스입니다.
 * 결제 사전 검증 및 PENDING 데이터 저장, 사후 검증을 통한 PAID 확정 및 마일리지 처리,
 * 결제 취소에 따른 환불 및 마일리지 롤백(원상복구) 처리를 담당합니다.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MileageService mileageService;
    private final MemberGradeService memberGradeService;
    private final ReservationRepository reservationRepository;
    private final FlightBookingRepository flightBookingRepository;
    private final InsurancePolicyRepository insurancePolicyRepository;
    private final WalletService walletService;

    /**
     * 결제창 진입 전 사전 등록 및 검증을 수행합니다.
     * 사용자가 보유한 마일리지 범위 내에서 차감액을 지정했는지 검증하고,
     * 고유 주문 번호(merchantUid)를 생성한 후 PENDING(대기) 상태의 Payment 레코드를 생성합니다.
     *
     * @param userId 결제를 진행하는 회원의 식별자
     * @param req    총 결제 대상 금액과 마일리지 사용액이 포함된 요청 DTO
     * @return 생성된 주문번호(merchantUid)와 실제 청구할 금액이 담긴 응답 DTO
     */
    @Transactional
    public PaymentPrepareResponse preparePayment(Long userId, PaymentPrepareRequest req) {
        LockedReservation locked = assertReservationOwnership(userId, req);

        // 1. 현재 사용자가 보유한 사용 가능한 실시간 마일리지 잔액 조회
        int currentMileage = mileageService.getCurrentMileage(userId);
        if (req.getUsedMileage() != null && req.getUsedMileage() > currentMileage) {
            throw new IllegalArgumentException("사용 가능한 마일리지를 초과했습니다.");
        }

        // 지갑 잔액 검증 로직 추가
        BigDecimal walletBalance = walletService.getBalance(userId);
        BigDecimal verifiedTotalAmount = locked.totalAmount();

        Integer usedMileage = req.getUsedMileage() != null ? req.getUsedMileage() : 0;

        if (usedMileage > verifiedTotalAmount.intValue()) {
            throw new IllegalArgumentException("사용 마일리지가 결제 금액을 초과합니다.");
        }

        BigDecimal pgAmount = verifiedTotalAmount.subtract(BigDecimal.valueOf(usedMileage));
        if (pgAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("결제 금액이 올바르지 않습니다.");
        }

        if (walletBalance.compareTo(pgAmount) < 0) {
            throw new IllegalArgumentException("지갑 잔액이 부족합니다.");
        }

        String reservationType = locked.type();
        if (paymentRepository.existsByReservationIdAndReservationTypeAndStatus(
                req.getReservationId(), reservationType, PaymentStatus.PENDING)) {
            throw new IllegalArgumentException("이미 진행 중인 결제(PENDING)가 있습니다.");
        }

        // 3. 고유한 주문번호 및 서버 발급 지갑 거래 ID 생성
        String merchantUid = "ORDER-" + LocalDateTime.now().getYear() + "-"
                + UUID.randomUUID().toString().substring(0, 8);
        String walletTxId = "WALLET-" + UUID.randomUUID().toString().replace("-", "");

        // 4. 사후 검증 단계에서 비교 및 변경하기 위해 PENDING 상태로 결제 건을 미리 DB에 저장
        Payment pendingPayment = Payment.builder()
                .userId(userId)
                .reservationId(req.getReservationId())
                .reservationType(reservationType)
                .totalAmount(verifiedTotalAmount)
                .pgAmount(pgAmount)
                .usedMileage(usedMileage)
                .accumulatedMileage(0) // 아직 결제 성공 전이므로 적립 마일리지는 0
                .status(PaymentStatus.PENDING)
                .merchantUid(merchantUid)
                .impUid(walletTxId)
                .build();

        paymentRepository.save(pendingPayment);

        return PaymentPrepareResponse.builder()
                .merchantUid(merchantUid)
                .pgAmount(pgAmount)
                .usedMileage(usedMileage)
                .reservationId(req.getReservationId())
                .walletTxId(walletTxId)
                .build();
    }

    /**
     * 결제 완료 후 백엔드 서버 측 사후 검증 및 승인 처리를 수행합니다.
     * 위변조 여부(실제 결제 금액 일치 여부)를 검증하고, 회원 등급에 맞는 적립률을 계산하여
     * 사용 마일리지 차감 및 신규 마일리지 적립을 하나의 트랜잭션 내에서 처리합니다.
     *
     * @param userId 결제한 회원의 식별자
     * @param req    거래 고유 ID(impUid) 및 주문번호(merchantUid)와 금액 정보를 담은 DTO
     * @return 결제 완료 상세 정보가 포함된 응답 DTO
     */
    @Transactional
    public PaymentValidateResponse validatePayment(Long userId, PaymentValidateRequest req) {
        // 1. 사전에 등록했던 PENDING 상태의 결제 정보 조회 (행 락)
        Payment payment = paymentRepository.findByMerchantUidForUpdate(req.getMerchantUid())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문번호입니다."));

        if (payment.getUserId() == null || !payment.getUserId().equals(userId)) {
            throw new ForbiddenException(ErrorCode.PAYMENT_NOT_OWNER);
        }

        // 2. PENDING 상태만 결제 확정 허용 (이중 결제/취소 건 거부)
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("이미 결제 처리된 주문입니다.");
        }

        // 서버 발급 walletTxId와 일치해야 함 (클라이언트 임의 발급 불가)
        if (payment.getImpUid() == null || !payment.getImpUid().equals(req.getImpUid())) {
            throw new IllegalArgumentException("결제 거래 ID가 일치하지 않습니다.");
        }

        // 3. 금액 위변조 여부 검증 (클라이언트가 보낸 값이 있으면 서버 PENDING 금액과 일치해야 함)
        if (req.getPgAmount() != null && payment.getPgAmount().compareTo(req.getPgAmount()) != 0) {
            throw new IllegalArgumentException("결제 요청 금액이 일치하지 않습니다.");
        }

        // 소유권 재검증
        if (!payment.getUserId().equals(userId)) {
            throw new ForbiddenException(ErrorCode.PAYMENT_NOT_OWNER);
        }

        // 4. 지갑에서 결제 금액 차감 시도 (잔액 부족 시 예외 발생)
        walletService.deduct(userId, payment.getPgAmount(), req.getMerchantUid());

        // 5. 회원 등급 기반 마일리지 적립률 계산 (서버 pgAmount 기준)
        Map<String, Object> gradeInfo = memberGradeService.getMemberGradeInfo(userId);
        double rate = (double) gradeInfo.get("rate");
        Integer accumulatedMileage = payment.getPgAmount().multiply(BigDecimal.valueOf(rate))
                .setScale(0, RoundingMode.FLOOR).intValue();

        // 6. 결제 건 상태를 PAID로 승인 및 적립 마일리지 세팅
        payment.setAccumulatedMileage(accumulatedMileage);
        payment.setStatus(PaymentStatus.PAID);
        confirmReservation(payment);

        // 7. 복합 결제에 사용된 마일리지를 차감 처리 (마일리지 로그 음수(-) 기록)
        if (payment.getUsedMileage() > 0) {
            mileageService.addLog(userId, -payment.getUsedMileage(), MileageLogType.USE,
                    "결제 시 마일리지 사용 (" + req.getMerchantUid() + ")");
        }
        // 8. 실 결제액에 등급 적립률을 적용한 마일리지 적립 처리 (마일리지 로그 양수(+) 기록)
        if (accumulatedMileage > 0) {
            mileageService.addLog(userId, accumulatedMileage, MileageLogType.EARN,
                    "결제 적립 (" + req.getMerchantUid() + ")");
        }

        paymentRepository.save(payment);

        return PaymentValidateResponse.builder()
                .paymentId(payment.getId())
                .impUid(payment.getImpUid())
                .totalAmount(payment.getTotalAmount())
                .pgAmount(payment.getPgAmount())
                .usedMileage(payment.getUsedMileage())
                .accumulatedMileage(payment.getAccumulatedMileage())
                .status(payment.getStatus())
                .build();
    }

    /**
     * 완료된 결제 건에 대해 취소 및 환불을 진행합니다.
     * 결제 상태를 CANCELLED로 변경하고, 결제 당시 차감했던 마일리지는 다시 복구(RESTORE)하고,
     * 결제 완료로 적립되었던 마일리지는 다시 회수(REVOKE)하는 롤백 트랜잭션을 수행합니다.
     *
     * @param userId    결제 취소를 요청한 사용자 식별자
     * @param paymentId 취소하고자 하는 결제 식별자
     * @param req       취소 사유 등이 명시된 요청 DTO
     * @return 환불 및 마일리지 복구/회수 결과 응답 DTO
     */
    @Transactional
    public PaymentCancelResponse cancelPayment(Long userId, Long paymentId, PaymentCancelRequest req) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 결제 건입니다."));

        if (payment.getStatus() == PaymentStatus.CANCELLED || payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException("이미 취소 혹은 환불된 결제입니다.");
        }
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("취소할 수 없는 결제 상태입니다.");
        }

        validateCancelPermissionAndMarkCancelled(userId, payment);

        BigDecimal refundedAmount = BigDecimal.ZERO;
        int restoredMileage = 0;

        if (payment.getStatus() == PaymentStatus.PENDING) {
            // 지갑 차감 전 — 환불/마일리지 원복 없이 void
            payment.setStatus(PaymentStatus.CANCELLED);
        } else {
            walletService.refund(payment.getUserId(), payment.getPgAmount(), req.getReason());
            refundedAmount = payment.getPgAmount();

            if (payment.getUsedMileage() > 0) {
                mileageService.addLog(payment.getUserId(), payment.getUsedMileage(), MileageLogType.RESTORE,
                        "결제 취소 복구 (" + req.getReason() + ")");
                restoredMileage = payment.getUsedMileage();
            }
            if (payment.getAccumulatedMileage() > 0) {
                mileageService.addLog(payment.getUserId(), -payment.getAccumulatedMileage(), MileageLogType.REVOKE,
                        "결제 취소 적립취소 (" + req.getReason() + ")");
            }
            payment.setStatus(PaymentStatus.CANCELLED);
        }

        paymentRepository.save(payment);

        return PaymentCancelResponse.builder()
                .paymentId(payment.getId())
                .status(payment.getStatus())
                .refundedAmount(refundedAmount)
                .restoredMileage(restoredMileage)
                .cancelledAt(LocalDateTime.now())
                .build();
    }

    /**
     * 어드민 예약 강제 취소 이벤트를 수신하여, 해당 예약건의 결제를 취소(환불)하고 마일리지를 원복합니다.
     */
    @EventListener
    @Transactional
    public void handleAdminBookingCancelEvent(AdminBookingCancelEvent event) {
        paymentRepository.findFirstByReservationIdAndReservationTypeOrderByIdDesc(event.getBookingId(), event.getTargetType()).ifPresent(payment -> {
            Payment locked = paymentRepository.findByIdForUpdate(payment.getId()).orElse(payment);
            if (locked.getStatus() == PaymentStatus.CANCELLED || locked.getStatus() == PaymentStatus.REFUNDED) {
                return;
            }

            String reason = "Admin force cancellation for " + event.getTargetType();

            if (locked.getStatus() == PaymentStatus.PENDING) {
                locked.setStatus(PaymentStatus.CANCELLED);
                paymentRepository.save(locked);
                return;
            }

            if (locked.getStatus() != PaymentStatus.PAID) {
                return;
            }

            walletService.refund(locked.getUserId(), locked.getPgAmount(), reason);
            locked.setStatus(PaymentStatus.REFUNDED);

            if (locked.getUsedMileage() > 0) {
                mileageService.addLog(locked.getUserId(), locked.getUsedMileage(), MileageLogType.RESTORE,
                        "관리자 직권 결제 취소 복구 (" + reason + ")");
            }
            if (locked.getAccumulatedMileage() > 0) {
                mileageService.addLog(locked.getUserId(), -locked.getAccumulatedMileage(), MileageLogType.REVOKE,
                        "관리자 직권 결제 적립 취소 (" + reason + ")");
            }

            paymentRepository.save(locked);
        });
    }

    /**
     * 예약 행을 비관적 락으로 잡고 소유권을 검증합니다.
     * prepare 동시 호출 시 PENDING 중복 생성을 직렬화합니다.
     */
    private LockedReservation assertReservationOwnership(Long userId, PaymentPrepareRequest req) {
        if (req.getReservationId() == null || req.getReservationType() == null) {
            throw new IllegalArgumentException("예약 정보가 필요합니다.");
        }

        String type = req.getReservationType().trim().toUpperCase();
        return switch (type) {
            case "ROOM", "CAR" -> {
                Reservation reservation = reservationRepository.findByIdForUpdate(req.getReservationId())
                        .orElseThrow(() -> new IllegalArgumentException("예약 정보가 존재하지 않습니다."));
                if (!reservation.getUserId().equals(userId)) {
                    throw new ForbiddenException(ErrorCode.PAYMENT_NOT_OWNER);
                }
                yield new LockedReservation(type, reservation.getTotalPrice());
            }
            case "FLIGHT" -> {
                FlightBooking booking = flightBookingRepository.findByIdForUpdate(req.getReservationId())
                        .orElseThrow(() -> new IllegalArgumentException("항공 예약 정보가 존재하지 않습니다."));
                if (!booking.getUserId().equals(userId)) {
                    throw new ForbiddenException(ErrorCode.PAYMENT_NOT_OWNER);
                }
                yield new LockedReservation(type, booking.getTotalPrice());
            }
            case "INSURANCE" -> {
                InsurancePolicy policy = insurancePolicyRepository.findByIdForUpdate(req.getReservationId())
                        .orElseThrow(() -> new IllegalArgumentException("보험 가입 정보가 존재하지 않습니다."));
                if (!policy.getUserId().equals(userId)) {
                    throw new ForbiddenException(ErrorCode.PAYMENT_NOT_OWNER);
                }
                yield new LockedReservation(type, policy.getTotalPremium());
            }
            default -> throw new IllegalArgumentException("알 수 없는 예약 타입입니다.");
        };
    }

    private record LockedReservation(String type, BigDecimal totalAmount) {
    }

    private void confirmReservation(Payment payment) {
        String type = payment.getReservationType() != null ? payment.getReservationType().trim().toUpperCase() : "";
        switch (type) {
            case "ROOM", "CAR" -> reservationRepository.findById(payment.getReservationId())
                    .ifPresent(reservation -> reservation.setStatus(ReservationStatus.CONFIRMED));
            case "FLIGHT" -> flightBookingRepository.findById(payment.getReservationId())
                    .ifPresent(booking -> booking.setStatus(BookingStatus.CONFIRMED));
            case "INSURANCE" -> insurancePolicyRepository.findById(payment.getReservationId())
                    .ifPresent(policy -> policy.setStatus(InsurancePolicyStatus.ACTIVE));
            default -> {
            }
        }
    }

    private void validateCancelPermissionAndMarkCancelled(Long userId, Payment payment) {
        // 지갑 환불/void는 구매자만 가능 (셀러의 일방적 구매자 잔액 환불 방지)
        if (payment.getUserId() == null || !payment.getUserId().equals(userId)) {
            throw new ForbiddenException(ErrorCode.PAYMENT_NOT_OWNER);
        }

        String type = payment.getReservationType() != null ? payment.getReservationType().trim().toUpperCase() : "";
        switch (type) {
            case "ROOM":
            case "CAR": {
                Reservation reservation = reservationRepository.findById(payment.getReservationId())
                        .orElseThrow(() -> new IllegalArgumentException("연관된 예약 정보가 존재하지 않습니다."));
                reservation.setStatus(ReservationStatus.CANCELLED);
                break;
            }
            case "FLIGHT": {
                FlightBooking booking = flightBookingRepository.findById(payment.getReservationId())
                        .orElseThrow(() -> new IllegalArgumentException("연관된 항공 예약 정보가 존재하지 않습니다."));
                booking.setStatus(BookingStatus.CANCELLED);
                break;
            }
            case "INSURANCE": {
                InsurancePolicy policy = insurancePolicyRepository.findById(payment.getReservationId())
                        .orElseThrow(() -> new IllegalArgumentException("연관된 보험 가입 정보가 존재하지 않습니다."));
                policy.setStatus(InsurancePolicyStatus.CANCELLED);
                break;
            }
            default:
                break;
        }
    }
}
