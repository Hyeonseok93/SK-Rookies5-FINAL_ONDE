import React from 'react';
import { PRIMARY, SECONDARY } from './constants';

interface StayDetailDateBannerProps {
  checkIn: string;
  checkOut: string;
  isRangeSelected: boolean;
  nights: number;
}

export const StayDetailDateBanner: React.FC<StayDetailDateBannerProps> = ({
  checkIn,
  checkOut,
  isRangeSelected,
  nights,
}) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(0,92,230,0.04) 0%, rgba(255,90,95,0.04) 100%)',
    border: '1px solid rgba(0,92,230,0.1)',
    borderRadius: '12px',
    padding: '0.65rem 0.9rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.8rem',
  }}>
    <div>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: PRIMARY, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        선택한 예약 일정
      </span>
      <strong style={{ fontSize: '0.9rem', color: '#1a1a1a' }}>
        {isRangeSelected ? `${checkIn} ➔ ${checkOut}` : `${checkIn || '—'} ➔ 선택 대기 중`}
      </strong>
    </div>
    <span style={{
      background: isRangeSelected ? PRIMARY : SECONDARY, color: '#fff',
      fontSize: '0.72rem', fontWeight: 800,
      padding: '0.22rem 0.65rem', borderRadius: '999px',
    }}>
      {isRangeSelected ? `${nights}박 ${nights + 1}일` : '체크아웃 선택 대기'}
    </span>
  </div>
);
