package com.onde.admin.application.settlement;

import com.onde.admin.application.settlement.dto.AdminSettlementCommentRequest;
import com.onde.admin.application.settlement.dto.AdminSettlementRejectRequest;
import com.onde.admin.application.settlement.dto.AdminSettlementDetailResponse;
import com.onde.admin.application.settlement.dto.AdminSettlementRevealResponse;
import com.onde.admin.security.AdminMemberIdentitySupport;
import com.onde.core.entity.member.Member;
import com.onde.core.entity.settlement.Settlement;
import com.onde.core.entity.settlement.SettlementStatus;
import com.onde.core.security.SensitiveRevealAuthService;
import com.onde.core.security.dto.SensitiveRevealPasswordRequest;
import com.onde.core.support.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * [플랫폼 본사 관리자(Admin) 관점 정산 처리 컨트롤러]
 * 각 입점 파트너사(판매자)가 요청한 매출 정산 데이터를 검토, 승인 및 지급 처리하는 API입니다.
 * - 정산 내역 필터링 및 페이징 조회
 * - 1차 정산 담당자(SELLER_ADMIN)의 1차 승인 (APPROVED_1ST)
 * - 본사 최고 관리자(SUPER_ADMIN)의 최종 승인 및 지급 확정 (COMPLETED)
 */
@RestController
@RequestMapping("/api/v1/admin/settlements")
@RequiredArgsConstructor
public class AdminSettlementController {

    private final AdminSettlementService adminSettlementService;
    private final AdminMemberIdentitySupport adminMemberIdentitySupport;
    private final SensitiveRevealAuthService sensitiveRevealAuthService;

    /**
     * [전체 판매자 대상 정산 내역 페이징 조회 API]
     * 본사 정산 담당자가 등록된 전체 정산 데이터를 확인하는 데 사용됩니다.
     * 특정 정산 상태(예: REQUESTED, APPROVED_1ST 등)로 필터링하여 페이징 조회가 가능합니다.
     *
     * @param status   필터링할 정산 상태 (선택 사항, 미입력 시 전체 상태 조회)
     * @param page     조회할 페이지 번호 (0부터 시작)
     * @param size     한 페이지당 출력할 정산 데이터 수
     * @return 페이징된 정산 데이터 목록, 입점사 계좌 정보 및 전체 엘리먼트 개수를 담은 성공 공통 응답 객체
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettlements(
            @RequestParam(name = "status", required = false) SettlementStatus status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        Map<String, Object> data = adminSettlementService.getSettlements(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{settlementId}/reveal")
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminSettlementRevealResponse>> revealSettlement(
            @PathVariable("settlementId") Long settlementId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SensitiveRevealPasswordRequest request) {
        Member admin = adminMemberIdentitySupport.requireMember(userDetails);
        sensitiveRevealAuthService.requirePasswordVerifiedMember(admin.getId(), request.getPassword());

        AdminSettlementRevealResponse response = adminSettlementService.revealSettlement(settlementId);
        return ResponseEntity.ok(ApiResponse.success(response, "정산 원문 조회 성공"));
    }

    /**
     * [1차 정산 담당자(SELLER_ADMIN)의 정산 1차 승인 API]
     * 판매자가 신청(REQUESTED)한 정산 건을 검토한 뒤 1차 승인 상태(APPROVED_1ST)로 전이시킵니다.
     *
     * @param settlementId 1차 승인을 가동할 정산 테이블 식별자 ID
     * @param body         1차 담당자가 남기는 추가 심사 의견(comment) 정보
     * @return 1차 승인이 완료된 정산 식별 ID 및 갱신 상태 정보
     */
    @PostMapping("/{settlementId}/approve-first")
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveFirst(
            @PathVariable("settlementId") Long settlementId,
            @Valid @RequestBody(required = false) AdminSettlementCommentRequest body) {

        String comment = body != null ? body.getComment() : null;
        Settlement updated = adminSettlementService.approveFirstSettlement(settlementId, comment);

        Map<String, Object> data = new HashMap<>();
        data.put("settlementId", updated.getId());
        data.put("status", updated.getStatus());
        data.put("approvedAt", updated.getApprovedAt());

        return ResponseEntity.ok(ApiResponse.success(data, "1차 승인 처리되었습니다."));
    }

    @PostMapping("/{settlementId}/approve")
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(
            @PathVariable("settlementId") Long settlementId,
            @Valid @RequestBody(required = false) AdminSettlementCommentRequest body) {
        Settlement updated = adminSettlementService.approveSettlement(
                settlementId,
                body != null ? body.getComment() : null);

        Map<String, Object> data = new HashMap<>();
        data.put("settlementId", updated.getId());
        data.put("status", updated.getStatus());
        data.put("approvedAt", updated.getApprovedAt());

        return ResponseEntity.ok(ApiResponse.success(data, "정산 승인 완료"));
    }

    @PostMapping("/{settlementId}/reject")
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reject(
            @PathVariable("settlementId") Long settlementId,
            @Valid @RequestBody(required = false) AdminSettlementRejectRequest body) {
        String rejectReason = body != null ? body.resolveReason() : null;
        LocalDateTime rejectedAt = LocalDateTime.now();
        Settlement updated = adminSettlementService.rejectSettlement(
                settlementId,
                rejectReason);

        Map<String, Object> data = new HashMap<>();
        data.put("settlementId", updated.getId());
        data.put("status", updated.getStatus());
        data.put("rejectReason", rejectReason);
        data.put("rejectedAt", rejectedAt);

        return ResponseEntity.ok(ApiResponse.success(data, "정산이 반려되었습니다."));
    }

    /**
     * [본사 최고 관리자(SUPER_ADMIN)의 최종 정산 확정 및 지급 완료 API]
     * 1차 승인(APPROVED_1ST)을 거친 정산 건에 대해 입금을 확정 짓고 정산 절차를 완료(COMPLETED) 상태로 종결합니다.
     *
     * @param settlementId 최종 지급 처리를 완료할 정산 테이블 식별자 ID
     * @param body         최종 승인 검토 의견(comment) 정보
     * @return 최종 지급 및 확정이 완결된 정산 식별 ID 및 상태 정보
     */
    @PostMapping("/{settlementId}/finalize")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> finalizeSettlement(
            @PathVariable("settlementId") Long settlementId,
            @Valid @RequestBody(required = false) AdminSettlementCommentRequest body) {

        String comment = body != null ? body.getComment() : null;
        Settlement updated = adminSettlementService.finalizeSettlement(settlementId, comment);

        Map<String, Object> data = new HashMap<>();
        data.put("settlementId", updated.getId());
        data.put("status", updated.getStatus());
        data.put("finalizedAt", updated.getFinalizedAt());

        return ResponseEntity.ok(ApiResponse.success(data, "정산이 최종 확정되었습니다."));
    }

    /**
     * [본사 관리자 대상 정산 상세 내역 조회 API]
     */
    @GetMapping("/{settlementId}/details")
    @PreAuthorize("hasAnyRole('SELLER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminSettlementDetailResponse>> getSettlementDetails(
            @PathVariable("settlementId") Long settlementId) {

        AdminSettlementDetailResponse response =
                adminSettlementService.getSettlementDetailResponse(settlementId);
        return ResponseEntity.ok(ApiResponse.success(response, "정산 상세 내역 조회가 완료되었습니다."));
    }
}
