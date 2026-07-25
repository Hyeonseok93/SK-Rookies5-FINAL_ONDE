package com.onde.api.application.accommodation;

import com.onde.api.application.accommodation.dto.SellerCarInventoryUpdateRequest;
import com.onde.api.application.accommodation.dto.SellerCarMultipartForm;
import com.onde.api.application.accommodation.dto.SellerCarRegisterRequest;
import com.onde.api.config.S3Uploader;
import com.onde.core.entity.accommodation.ApprovalStatus;
import com.onde.core.entity.accommodation.Car;
import com.onde.core.entity.accommodation.Inventory;
import com.onde.core.entity.reservation.ReservationTarget;
import com.onde.core.repository.CarRepository;
import com.onde.core.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SellerCarService {

    private final CarService carService;
    private final CarRepository carRepository;
    private final InventoryRepository inventoryRepository;
    private final S3Uploader s3Uploader;

    @Transactional(readOnly = true)
    public Map<String, Object> getCars(Long sellerId) {
        List<Car> list = carService.getCarsBySellerId(sellerId);
        List<Map<String, Object>> mapped = list.stream().map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("propertyId", c.getId());
            item.put("name", c.getModelName());
            String status = "ACTIVE";
            if (c.getApprovalStatus() == ApprovalStatus.PENDING) {
                status = "PENDING";
            } else if (c.getApprovalStatus() == ApprovalStatus.REJECTED) {
                status = "REJECTED";
            }
            item.put("status", status);
            item.put("basePrice", 50000);
            return item;
        }).toList();

        Map<String, Object> data = new HashMap<>();
        data.put("cars", mapped);
        data.put("totalCount", mapped.size());
        return data;
    }

    @Transactional
    public Long registerCarMultipart(Long sellerId, SellerCarMultipartForm form, MultipartFile thumbnail) {
        if (carRepository.existsByLicensePlate(form.getLicensePlate())) {
            throw new IllegalArgumentException("이미 등록된 차량 번호입니다.");
        }

        Car car = new Car();
        car.setSellerId(sellerId);
        car.setModelName(form.getModelName());
        car.setCarType(form.getCarType());
        car.setLicensePlate(form.getLicensePlate());
        car.setLocation(form.getLocation() == null || form.getLocation().isBlank() ? "제주" : form.getLocation());
        car.setApprovalStatus(ApprovalStatus.PENDING);
        if (thumbnail != null && !thumbnail.isEmpty()) {
            car.setThumbnailUrl(s3Uploader.upload(thumbnail, "cars"));
        }
        Car saved = carRepository.save(car);

        String dailyPrice = form.getDailyPrice();
        if (dailyPrice != null && !dailyPrice.isBlank()) {
            BigDecimal priceVal = new BigDecimal(dailyPrice);
            Inventory inventory = new Inventory();
            inventory.setTargetType(ReservationTarget.CAR);
            inventory.setTargetId(saved.getId());
            inventory.setDate(LocalDate.now());
            inventory.setBasePrice(priceVal);
            inventory.setStock(1);
            inventoryRepository.save(inventory);
        }

        return saved.getId();
    }

    @Transactional
    public Long registerCar(Long sellerId, SellerCarRegisterRequest request) {
        if (carRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new IllegalArgumentException("이미 등록된 차량 번호입니다.");
        }

        Car car = new Car();
        car.setSellerId(sellerId);
        car.setModelName(request.getModelName());
        car.setCarType(request.getCarType());
        car.setLicensePlate(request.getLicensePlate());
        car.setApprovalStatus(ApprovalStatus.PENDING);

        if (request.getThumbnailUrl() != null) {
            car.setThumbnailUrl(request.getThumbnailUrl());
        }

        Car saved = carRepository.save(car);

        if (request.getDailyPrice() != null) {
            Inventory inventory = new Inventory();
            inventory.setTargetType(ReservationTarget.CAR);
            inventory.setTargetId(saved.getId());
            inventory.setDate(LocalDate.now());
            inventory.setBasePrice(BigDecimal.valueOf(request.getDailyPrice()));
            inventory.setStock(1);
            inventoryRepository.save(inventory);
        }

        return saved.getId();
    }

    @Transactional
    public void updateCarInventory(Long sellerId, SellerCarInventoryUpdateRequest request) {
        Long carId = request.getCarId();
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException("carId가 존재하지 않습니다."));
        if (!car.getSellerId().equals(sellerId)) {
            throw new IllegalArgumentException("본인 소유 차량만 수정할 수 있습니다.");
        }

        Inventory inventory = inventoryRepository.findByTargetTypeAndTargetIdAndDate(
                        ReservationTarget.CAR, carId, LocalDate.now())
                .orElseGet(() -> {
                    Inventory created = new Inventory();
                    created.setTargetType(ReservationTarget.CAR);
                    created.setTargetId(carId);
                    created.setDate(LocalDate.now());
                    created.setBasePrice(BigDecimal.ZERO);
                    created.setStock(0);
                    return created;
                });
        if (request.getDailyPrice() != null) {
            inventory.setBasePrice(request.getDailyPrice());
        }
        if (request.getAvailableCount() != null) {
            inventory.setStock(request.getAvailableCount());
        }
        inventoryRepository.save(inventory);
    }
}
