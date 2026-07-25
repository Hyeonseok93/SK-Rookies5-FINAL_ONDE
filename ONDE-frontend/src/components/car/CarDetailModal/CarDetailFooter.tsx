import React from 'react';
import { SECONDARY } from './constants';

interface CarDetailFooterProps {
  isRangeSelected: boolean;
  rentalDays: number;
  rawTotal: number;
  finalTotal: number;
  booking: boolean;
  onBook: () => void;
}

export const CarDetailFooter: React.FC<CarDetailFooterProps> = ({
  isRangeSelected,
  rentalDays,
  rawTotal,
  finalTotal,
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
        <span>차량 대여료 ({isRangeSelected ? `${rentalDays}일` : '선택 대기'})</span>
        <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{isRangeSelected ? `₩${rawTotal.toLocaleString('ko-KR')}` : '₩ -'}</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#717171', marginBottom: '0.35rem', paddingLeft: '0.4rem' }}>
        {isRangeSelected ? `₩${(rawTotal / rentalDays).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}/일 평균 요금 (총 ${rentalDays}일)` : '일정을 완료해 주세요'}
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
      {booking ? '예약 처리 중...' : '차량 예약하기'}
    </button>
  </div>
);
