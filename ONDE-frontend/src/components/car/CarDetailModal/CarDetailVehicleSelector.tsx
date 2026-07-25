import React from 'react';
import type { CarDto } from '@/api/carApi';
import { PRIMARY, SECONDARY } from './constants';

interface CarDetailVehicleSelectorProps {
  targetVehicles: CarDto[];
  availableVehicles: CarDto[];
  selectedCarId: number;
  onSelect: (carId: number) => void;
}

export const CarDetailVehicleSelector: React.FC<CarDetailVehicleSelectorProps> = ({
  targetVehicles,
  availableVehicles,
  selectedCarId,
  onSelect,
}) => {
  if (targetVehicles.length <= 1) return null;

  return (
    <div style={{ marginBottom: '0.8rem', padding: '0.2rem' }}>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: PRIMARY, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        차량 선택 (번호판)
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
        {targetVehicles.map((v) => {
          const isSelected = selectedCarId === v.carId;
          const isAvailable = availableVehicles.some(av => av.carId === v.carId);
          return (
            <button
              key={v.carId}
              disabled={!isAvailable}
              onClick={() => onSelect(v.carId)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: isSelected ? `2px solid ${PRIMARY}` : '1.5px solid #e2e8f0',
                background: isSelected ? 'rgba(0, 92, 230, 0.04)' : !isAvailable ? '#f8fafc' : '#fff',
                color: isSelected ? PRIMARY : !isAvailable ? '#94a3b8' : '#1e293b',
                fontWeight: isSelected ? '800' : '500',
                fontSize: '0.78rem',
                cursor: !isAvailable ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center',
                opacity: !isAvailable ? 0.6 : 1,
                boxShadow: isSelected ? '0 2px 6px rgba(0,92,230,0.1)' : 'none',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
                {v.licensePlate || `차량 ${v.carId}`}
              </div>
              <div style={{ fontSize: '0.62rem', marginTop: '2px', fontWeight: '700', color: isAvailable ? (isSelected ? PRIMARY : '#64748b') : SECONDARY }}>
                {isAvailable ? '대여 가능' : '예약 마감'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
