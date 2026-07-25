package com.onde.admin.application.settlement;

import com.onde.admin.application.settlement.dto.AdminSettlementDetailResponse;
import com.onde.admin.application.settlement.dto.AdminSettlementRevealResponse;
import com.onde.core.entity.settlement.SellerAccount;
import com.onde.core.entity.settlement.Settlement;
import com.onde.core.entity.settlement.SettlementStatus;
import com.onde.core.entity.payment.Payment;
import com.onde.core.repository.PaymentRepository;
import com.onde.core.repository.SellerAccountRepository;
import com.onde.core.repository.SettlementRepository;
import com.onde.core.security.PersonalDataMasker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSettlementService {

    private final SettlementRepository settlementRepository;
    private final SellerAccountRepository sellerAccountRepository;
    private final PaymentRepository paymentRepository;

    /**
     * 특정 판매자의 정산 계좌 조회
     */
    @Transactional(readOnly = true)
    public SellerAccount getAccount(Long sellerId) {
        return sellerAccountRepository.findByMemberId(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("등록된 계좌 없음"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSettlements(SettlementStatus status, int page, int size) {
        Page<Settlement> result;
        if (status != null) {
            result = settlementRepository.findByStatus(status, PageRequest.of(page, size));
        } else {
            result = settlementRepository.findAll(PageRequest.of(page, size));
        }

        List<Map<String, Object>> settlementList = new ArrayList<>();
        for (Settlement s : result.getContent()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("settlementId", PersonalDataMasker.maskNumericId(s.getId()));
            map.put("settlementMonth", s.getSettlementDate().toString());
            map.put("grossAmount", s.getGrossAmount());
            map.put("commission", s.getCommission());
            map.put("netAmount", s.getNetAmount());
            map.put("status", s.getStatus());
            map.put("sellerId", s.getSellerId());

            SellerAccount account = getAccount(s.getSellerId());
            map.put("sellerName", PersonalDataMasker.maskName(account.getAccountHolder()));
            map.put("bankName", PersonalDataMasker.maskBankName(account.getBankName()));
            map.put("accountNumber", PersonalDataMasker.maskAccountNumber(account.getAccountNumber()));

            settlementList.add(map);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("settlements", settlementList);
        data.put("totalCount", result.getTotalElements());
        return data;
    }

    @Transactional(readOnly = true)
    public AdminSettlementRevealResponse revealSettlement(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));

        SellerAccount account = getAccount(settlement.getSellerId());
        return AdminSettlementRevealResponse.builder()
                .settlementId(settlement.getId())
                .sellerName(account.getAccountHolder())
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminSettlementDetailResponse getSettlementDetailResponse(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));

        List<PaymentRepository.SettlementDetailProjection> projections =
                paymentRepository.findSettlementDetails(settlementId);

        List<AdminSettlementDetailResponse.DetailItem> items = projections.stream()
                .map(p -> AdminSettlementDetailResponse.DetailItem.builder()
                        .paymentId(p.getPaymentId())
                        .reservationId(p.getReservationId())
                        .targetType(p.getTargetType())
                        .productName(p.getProductName())
                        .amount(p.getAmount())
                        .paymentDate(p.getPaymentDate())
                        .build())
                .collect(Collectors.toList());

        return AdminSettlementDetailResponse.builder()
                .settlementId(PersonalDataMasker.maskNumericId(settlement.getId()))
                .settlementDate(settlement.getSettlementDate())
                .details(items)
                .build();
    }

    /**
     * 계좌번호 마스킹
     */
    public String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 8) {
            return accountNumber;
        }
        if (accountNumber.contains("-")) {
            String[] parts = accountNumber.split("-");
            if (parts.length >= 3) {
                StringBuilder sb = new StringBuilder();
                sb.append(parts[0]).append("-");
                for (int i = 1; i < parts.length - 1; i++) {
                    sb.append("*".repeat(parts[i].length())).append("-");
                }
                sb.append(parts[parts.length - 1]);
                return sb.toString();
            }
        }
        int len = accountNumber.length();
        return accountNumber.substring(0, 3) + "***" + accountNumber.substring(len - 3);
    }

    /**
     * 1차 정산 승인
     */
    @Transactional
    public Settlement approveFirstSettlement(Long settlementId, String comment) {
        Settlement settlement = settlementRepository.findById(settlementId)
                 .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));
  
        if (settlement.getStatus() != SettlementStatus.REQUESTED) {
            throw new IllegalStateException("정산 요청(REQUESTED) 상태에서만 1차 승인이 가능합니다.");
        }
  
        settlement.setStatus(SettlementStatus.APPROVED_1ST);
        settlement.setApprovedAt(LocalDateTime.now());
        return settlement;
    }

    /**
     * 영업 관리자 정산 승인
     */
    @Transactional
    public Settlement approveSettlement(Long settlementId, String comment) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));

        if (settlement.getStatus() != SettlementStatus.REQUESTED
                && settlement.getStatus() != SettlementStatus.APPROVED_1ST) {
            throw new IllegalStateException("정산 요청 또는 1차 승인 상태에서만 승인할 수 있습니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        settlement.setStatus(SettlementStatus.COMPLETED);
        settlement.setApprovedAt(now);
        if (settlement.getFinalizedAt() == null) {
            settlement.setFinalizedAt(now);
        }
        return settlement;
    }

    @Transactional
    public Settlement rejectSettlement(Long settlementId, String comment) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));

        if (settlement.getStatus() != SettlementStatus.REQUESTED
                && settlement.getStatus() != SettlementStatus.APPROVED_1ST) {
            throw new IllegalStateException("정산 요청 또는 1차 승인 상태에서만 반려가 가능합니다.");
        }

        settlement.setStatus(SettlementStatus.REJECTED);

        // 반려된 정산 건에 속해있던 결제 건들의 settlementId를 null로 돌려주어 재신청 가능하게 함
        List<Payment> payments = paymentRepository.findBySettlementId(settlementId);
        for (Payment p : payments) {
            p.setSettlementId(null);
        }
        paymentRepository.saveAll(payments);

        return settlement;
    }

    /**
     * 최종 정산 확정
     */
    @Transactional
    public Settlement finalizeSettlement(Long settlementId, String comment) {
        Settlement settlement = settlementRepository.findById(settlementId)
                 .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));
  
        if (settlement.getStatus() != SettlementStatus.APPROVED_1ST) {
            throw new IllegalStateException("1차 승인(APPROVED_1ST) 상태에서만 최종 확정이 가능합니다.");
        }
  
        settlement.setStatus(SettlementStatus.COMPLETED);
        settlement.setFinalizedAt(LocalDateTime.now());
        return settlement;
    }

    /**
     * 특정 정산 건의 상세 내역을 조회합니다. (본사 관리자용)
     */
    @Transactional(readOnly = true)
    public List<PaymentRepository.SettlementDetailProjection> getSettlementDetails(Long settlementId) {
        if (!settlementRepository.existsById(settlementId)) {
            throw new IllegalArgumentException("해당 정산 건이 존재하지 않습니다.");
        }

        return paymentRepository.findSettlementDetails(settlementId);
    }
}
