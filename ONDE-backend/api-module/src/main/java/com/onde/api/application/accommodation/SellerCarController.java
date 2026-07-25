package com.onde.api.application.accommodation;

import com.onde.api.application.accommodation.dto.SellerCarInventoryUpdateRequest;
import com.onde.api.application.accommodation.dto.SellerCarMultipartForm;
import com.onde.api.application.accommodation.dto.SellerCarRegisterRequest;
import com.onde.core.validation.MultipartInputValidator;
import com.onde.api.security.LoginMember;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import com.onde.core.support.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/v1/seller")
@RequiredArgsConstructor
public class SellerCarController {

    private final SellerCarService sellerCarService;

    @GetMapping("/cars")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCars(
            @LoginMember Long sellerId) {
        Map<String, Object> data = sellerCarService.getCars(sellerId);
        return ResponseEntity.ok(ApiResponse.success(data, "판매자 등록 렌터카 목록 조회가 성공적으로 완료되었습니다."));
    }

    @PostMapping(value = "/cars", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Long>> registerCarMultipart(
            @RequestParam(required = false) MultipartFile thumbnail,
            @Valid @ModelAttribute SellerCarMultipartForm form,
            @LoginMember Long sellerId) {
        MultipartInputValidator.validateOptionalImage(thumbnail);
        Long id = sellerCarService.registerCarMultipart(sellerId, form, thumbnail);
        return ResponseEntity.ok(ApiResponse.success(id, "렌터카 등록 신청이 완료되었습니다."));
    }

    @PostMapping("/cars")
    public ResponseEntity<ApiResponse<Long>> registerCar(
            @Valid @RequestBody SellerCarRegisterRequest request,
            @LoginMember Long sellerId) {
        Long id = sellerCarService.registerCar(sellerId, request);
        return ResponseEntity.ok(ApiResponse.success(id, "렌터카 등록 신청이 완료되었습니다."));
    }

    @PutMapping("/inventories/cars")
    public ResponseEntity<ApiResponse<Void>> updateCarInventory(
            @Valid @RequestBody SellerCarInventoryUpdateRequest request,
            @LoginMember Long sellerId) {
        sellerCarService.updateCarInventory(sellerId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "렌터카 재고 및 가격이 수정되었습니다."));
    }
}
