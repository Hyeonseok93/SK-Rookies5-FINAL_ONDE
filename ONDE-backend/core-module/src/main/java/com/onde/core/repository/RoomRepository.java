package com.onde.core.repository;

import com.onde.core.entity.accommodation.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByAccommodationId(Long accommodationId);
}
