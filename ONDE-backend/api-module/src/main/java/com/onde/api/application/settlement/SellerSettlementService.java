package com.onde.api.application.settlement;

import com.onde.api.application.settlement.dto.SellerAccountRequest;
import com.onde.api.application.settlement.dto.SellerAccountResponse;
import com.onde.core.entity.member.Member;
import com.onde.core.entity.settlement.SellerAccount;
import com.onde.core.entity.settlement.Settlement;
import com.onde.core.repository.MemberRepository;
import com.onde.core.repository.SellerAccountRepository;
import com.onde.core.repository.SettlementRepository;
import com.onde.core.util.AesUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerSettlementService {

    private final MemberRepository memberRepository;
    private final SellerAccountRepository sellerAccountRepository;
    private final SettlementRepository settlementRepository;
    private final NtsBusinessVerificationService ntsService;
    private final AesUtil aesUtil;

    @Transactional(readOnly = true)
    public Page<Settlement> getMySettlements(Long sellerId, Pageable pageable) {
        return settlementRepository.findBySellerId(sellerId, pageable);
    }

    @Transactional(readOnly = true)
    public Settlement requireOwnedSettlement(Long settlementId, Long sellerId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("해당 정산 건이 존재하지 않습니다."));

        if (!settlement.getSellerId().equals(sellerId)) {
            throw new IllegalArgumentException("본인의 정산 내역만 조회할 수 있습니다.");
        }
        return settlement;
    }

    @Transactional
    public void registerAccount(String email, SellerAccountRequest request) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 1. 국세청 사업자 진위 확인
        boolean isValidBusiness = ntsService.verifyBusinessNumber(
                request.getBusinessNumber(),
                request.getRepresentativeName(),
                request.getOpenedAt()
        );
        if (!isValidBusiness) {
            throw new IllegalArgumentException("유효하지 않은 사업자등록번호 이거나 폐업 상태입니다.");
        }

        // 2. 계좌번호 AES 암호화
        String encryptedAccountNumber = aesUtil.encrypt(request.getAccountNumber());

        // 3. 기존 계좌가 있으면 업데이트, 없으면 새로 생성
        SellerAccount account = sellerAccountRepository.findByMemberId(member.getId())
                .orElseGet(() -> SellerAccount.builder()
                        .member(member)
                        .businessNumber(request.getBusinessNumber())
                        .representativeName(request.getRepresentativeName())
                        .openedAt(request.getOpenedAt())
                        .build());

        account.updateAccount(request.getBankName(), encryptedAccountNumber, request.getAccountHolder());
        account.setBusinessName(request.getBusinessName());
        account.setContactPhone(request.getContactPhone());
        account.setBusinessAddress(request.getBusinessAddress());
        sellerAccountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public SellerAccountResponse getAccount(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        SellerAccount account = sellerAccountRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new IllegalArgumentException("등록된 정산 계좌가 없습니다."));

        // 계좌번호 복호화 수행
        String decryptedAccountNumber = aesUtil.decrypt(account.getAccountNumber());

        return SellerAccountResponse.builder()
                .bankName(account.getBankName())
                .businessName(account.getBusinessName())
                .contactPhone(account.getContactPhone())
                .businessAddress(account.getBusinessAddress())
                .accountNumber(decryptedAccountNumber)
                .accountHolder(account.getAccountHolder())
                .businessNumber(account.getBusinessNumber())
                .representativeName(account.getRepresentativeName())
                .openedAt(account.getOpenedAt())
                .build();
    }
}
