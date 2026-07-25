import React from 'react';
import { PRIMARY } from './constants';

interface StayDetailGuestPickerProps {
  adultCount: number;
  roomCount: number;
  onAdultChange: (next: number) => void;
  onRoomChange: (next: number) => void;
}

export const StayDetailGuestPicker: React.FC<StayDetailGuestPickerProps> = ({
  adultCount,
  roomCount,
  onAdultChange,
  onRoomChange,
}) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '12px',
    background: '#f0f2f5', borderRadius: '12px',
    padding: '0.85rem 1rem',
    marginBottom: '0.8rem',
    border: '1px solid #ddd',
  }}>
    {/* Adults */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>투숙객</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={() => onAdultChange(Math.max(1, adultCount - 1))}
          disabled={adultCount <= 1}
          style={{
            width: '26px', height: '26px', borderRadius: '50%',
            border: adultCount <= 1 ? '1.5px solid #ddd' : `1.5px solid ${PRIMARY}`,
            color: adultCount <= 1 ? '#ddd' : PRIMARY,
            background: '#fff', cursor: adultCount <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >−</button>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a', minWidth: '14px', textAlign: 'center' }}>{adultCount}</span>
        <button
          type="button"
          onClick={() => onAdultChange(Math.min(10, adultCount + 1))}
          style={{
            width: '26px', height: '26px', borderRadius: '50%',
            border: `1.5px solid ${PRIMARY}`, color: PRIMARY,
            background: '#fff', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>
    </div>

    {/* Rooms */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '8px' }}>
      <div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>객실 수</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={() => onRoomChange(Math.max(1, roomCount - 1))}
          disabled={roomCount <= 1}
          style={{
            width: '26px', height: '26px', borderRadius: '50%',
            border: roomCount <= 1 ? '1.5px solid #ddd' : `1.5px solid ${PRIMARY}`,
            color: roomCount <= 1 ? '#ddd' : PRIMARY,
            background: '#fff', cursor: roomCount <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >−</button>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a', minWidth: '14px', textAlign: 'center' }}>{roomCount}</span>
        <button
          type="button"
          onClick={() => onRoomChange(Math.min(10, roomCount + 1))}
          style={{
            width: '26px', height: '26px', borderRadius: '50%',
            border: `1.5px solid ${PRIMARY}`, color: PRIMARY,
            background: '#fff', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>
    </div>

    <p style={{ fontSize: '0.7rem', color: '#717171', marginTop: '2px' }}>
      총 객실 {roomCount}개 · 성인 {adultCount}명 기준
    </p>
  </div>
);
