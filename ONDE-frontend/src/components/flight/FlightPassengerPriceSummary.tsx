import React from 'react';

interface FlightPassengerPriceSummaryProps {
  passengerCount: number;
  basePrice: number;
  totalAmount: number;
}

export const FlightPassengerPriceSummary: React.FC<FlightPassengerPriceSummaryProps> = ({
  passengerCount,
  basePrice,
  totalAmount,
}) => (
  <div
    style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      padding: '1.2rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div>
      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
        최종 결제 예정 금액 ({passengerCount}명)
      </span>
      <strong style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ff5a5f', fontFamily: 'GmarketSansBold' }}>
        ₩{totalAmount.toLocaleString()}
      </strong>
    </div>
    <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'right', fontWeight: 600 }}>
      ₩{basePrice.toLocaleString()} × {passengerCount}명
      <br />
      <span style={{ color: '#005ce6', fontWeight: 800 }}>세금 및 공항세 포함</span>
    </div>
  </div>
);
