import React from 'react';
import type { CarDto } from '@/api/carApi';
import { ListingThumbnail } from '@/components/common/ListingThumbnail';
import { hasDisplayPrice } from '@/utils/listingDisplay';
import { PRIMARY, SECONDARY } from './constants';

interface CarDetailHeaderProps {
  car: CarDto;
  selectedVehicle: CarDto;
}

export const CarDetailHeader: React.FC<CarDetailHeaderProps> = ({ car, selectedVehicle }) => (
  <div style={{
    display: 'flex', gap: '1.2rem', marginBottom: '0.8rem',
    alignItems: 'center', borderBottom: '1px solid #ddd',
    paddingBottom: '0.8rem', flexShrink: 0,
  }}>
    <div style={{
      width: '65px', height: '65px', borderRadius: '12px',
      overflow: 'hidden', flexShrink: 0, background: '#f0f2f5',
    }}>
      <ListingThumbnail
        imageUrl={car.imageUrl}
        alt={car.name}
        iconClass="fa-car"
        className="w-full h-full text-xl"
        imgClassName="w-full h-full object-cover"
      />
    </div>
    <div>
      <h3 style={{ fontSize: '1.18rem', fontWeight: 800, marginBottom: '0.2rem', color: '#1a1a1a', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
        {car.name}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', color: '#717171', flexWrap: 'wrap' }}>
        <span><i className="fa-solid fa-car" /> {car.typeLabel}</span>
        {selectedVehicle.licensePlate && (
          <>
            <span>•</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>
              <i className="fa-solid fa-rectangle-ad" /> {selectedVehicle.licensePlate}
            </span>
          </>
        )}
        {car.seats != null && (
          <>
            <span>•</span>
            <span><i className="fa-solid fa-users" /> {car.seats}인승</span>
          </>
        )}
        {car.fuel && (
          <>
            <span>•</span>
            <span><i className="fa-solid fa-gas-pump" /> {car.fuel}</span>
          </>
        )}
        {hasDisplayPrice(car.pricePerDay) && (
          <>
            <span>•</span>
            <span style={{ color: SECONDARY, fontWeight: 700 }}>₩{car.pricePerDay.toLocaleString('ko-KR')} / per Day</span>
          </>
        )}
      </div>
    </div>
  </div>
);
