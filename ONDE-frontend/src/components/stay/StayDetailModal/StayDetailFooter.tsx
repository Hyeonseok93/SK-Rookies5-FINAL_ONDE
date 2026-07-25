import React from 'react';
import { SECONDARY } from './constants';

interface StayDetailFooterProps {
  isRangeSelected: boolean;
  nights: number;
  roomCount: number;
  finalTotal: number;
  billingDesc: string;
  booking: boolean;
  onBook: () => void;
}

export const StayDetailFooter: React.FC<StayDetailFooterProps> = ({
  isRangeSelected,
  nights,
  roomCount,
  finalTotal,
  billingDesc,
  booking,
  onBook,
}) => (
  <div style={{ flexShrink: 0, borderTop: '1px solid #ddd', paddingTop: '0.8rem' }}>
    {/* Billing Box */}
    <div style={{
      background: '#f0f2f5', borderRadius: '12px',
      padding: '0.9rem 1.1rem', marginBottom: '0.8rem',
      border: '1px solid #ddd',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4a4a4a', marginBottom: '0.35rem' }}>
        <span>객실 이용료 ({isRangeSelected ? `${nights}박 × 객실 ${roomCount}개` : '선택 대기'})</span>
        <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{isRangeSelected ? `₩${finalTotal.toLocaleString('ko-KR')}` : '₩ -'}</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#717171', marginBottom: '0.35rem', paddingLeft: '0.4rem' }}>
        {billingDesc}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.55rem', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
        <span>최종 결제 합계</span>
        <span style={{ color: SECONDARY, fontSize: '1.22rem', fontFamily: 'GmarketSansBold, Pretendard, sans-serif' }}>
          {isRangeSelected ? `₩${finalTotal.toLocaleString('ko-KR')}` : '₩ -'}
        </span>
      </div>
    </div>

    {/* CTA Button */}
    <button
      onClick={onBook}
      disabled={booking}
      style={{
        width: '100%', padding: '0.75rem',
        background: `linear-gradient(135deg, ${SECONDARY} 0%, #e0484d 100%)`,
        color: '#fff', border: 'none', borderRadius: '12px',
        fontSize: '0.9rem', fontWeight: 800, cursor: booking ? 'wait' : 'pointer',
        opacity: booking ? 0.7 : 1,
        boxShadow: '0 4px 12px rgba(255,90,95,0.28)',
        letterSpacing: '-0.2px',
      }}
    >
      {booking ? '예약 처리 중...' : '숙소 예약하기'}
    </button>
  </div>
);
