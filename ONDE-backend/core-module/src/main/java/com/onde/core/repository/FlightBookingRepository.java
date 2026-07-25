package com.onde.core.repository;

import com.onde.core.entity.flight.BookingStatus;
import com.onde.core.entity.flight.FlightBooking;
import com.onde.core.entity.flight.SeatClass;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlightBookingRepository extends JpaRepository<FlightBooking, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select fb from FlightBooking fb where fb.id = :id")
    Optional<FlightBooking> findByIdForUpdate(@Param("id") Long id);

    List<FlightBooking> findByStatusAndReservedUntilBefore(BookingStatus status, LocalDateTime dateTime);
    Optional<FlightBooking> findByBookingCode(String bookingCode);

    @Query("SELECT COUNT(fb) FROM FlightBooking fb WHERE fb.flightSchedule.id = :scheduleId AND fb.seatClass = :seatClass AND fb.status IN (com.onde.core.entity.flight.BookingStatus.CONFIRMED, com.onde.core.entity.flight.BookingStatus.PENDING_PAYMENT)")
    long countActiveBookings(
        @Param("scheduleId") Long scheduleId,
        @Param("seatClass") SeatClass seatClass
    );

    @org.springframework.data.jpa.repository.QueryHints(value = {
        @jakarta.persistence.QueryHint(name = "org.hibernate.fetchSize", value = "100"),
        @jakarta.persistence.QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    @Query("SELECT fb FROM FlightBooking fb WHERE fb.flightSchedule.id = :scheduleId")
    java.util.stream.Stream<FlightBooking> streamByFlightScheduleId(@Param("scheduleId") Long scheduleId);

    org.springframework.data.domain.Page<FlightBooking> findByUserId(Long userId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<FlightBooking> findByUserIdAndStatus(Long userId, BookingStatus status, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COALESCE(SUM(fb.totalPrice), 0) FROM FlightBooking fb WHERE fb.status = com.onde.core.entity.flight.BookingStatus.CONFIRMED AND fb.createdAt >= :start AND fb.createdAt < :end")
    java.math.BigDecimal sumTotalPriceByStatusAndCreatedAtBetween(
            @Param("start") LocalDateTime start, 
            @Param("end") LocalDateTime end
    );

    @Query("SELECT fb FROM FlightBooking fb JOIN FETCH fb.flightSchedule fs JOIN FETCH fs.route r WHERE r.sellerId = :sellerId ORDER BY fb.createdAt DESC")
    List<FlightBooking> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(fb) FROM FlightBooking fb WHERE fb.status = com.onde.core.entity.flight.BookingStatus.CONFIRMED AND fb.createdAt >= :start AND fb.createdAt < :end")
    long countByStatusAndCreatedAtBetween(
            @Param("start") LocalDateTime start, 
            @Param("end") LocalDateTime end
    );
}


