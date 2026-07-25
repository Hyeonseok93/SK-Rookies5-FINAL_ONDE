import React from 'react';
import type { CalendarCell } from '@/utils/calendarUtils';
import { monthLabel } from '@/utils/calendarUtils';
import { PRIMARY, SECONDARY } from './constants';

interface StayDetailCalendarProps {
  calYear: number;
  calMonth: number;
  cells: CalendarCell[];
  checkIn: string;
  checkOut: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCellClick: (dateStr: string, disabled: boolean) => void;
}

function getCellStyle(
  cell: { dateStr: string; disabled: boolean; isEmpty: boolean; isWeekend: boolean },
  checkIn: string,
  checkOut: string,
) {
  if (cell.isEmpty) return {};
  const isStart = cell.dateStr === checkIn;
  const isEnd = cell.dateStr === checkOut;
  const inRange = checkIn && checkOut && cell.dateStr > checkIn && cell.dateStr < checkOut;

  if (isStart || isEnd) {
    return {
      background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
      color: '#fff',
      borderRadius: '10px',
      boxShadow: `0 4px 10px rgba(0,92,230,0.22)`,
      border: '1.5px solid transparent',
    };
  }
  if (inRange) {
    return {
      background: 'rgba(0,92,230,0.08)',
      border: '1.5px solid rgba(0,92,230,0.15)',
      borderRadius: '4px',
      color: PRIMARY,
    };
  }
  if (cell.disabled) {
    return {
      opacity: 0.4,
      cursor: 'not-allowed',
      background: '#f7f9fa',
      borderRadius: '10px',
      border: '1.5px solid transparent',
    };
  }
  return {
    cursor: 'pointer',
    borderRadius: '10px',
    border: '1.5px solid transparent',
    transition: 'all 0.15s ease',
  };
}

export const StayDetailCalendar: React.FC<StayDetailCalendarProps> = ({
  calYear,
  calMonth,
  cells,
  checkIn,
  checkOut,
  onPrevMonth,
  onNextMonth,
  onCellClick,
}) => (
  <div style={{
    margin: '0.8rem 0', padding: '0.9rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '12px',
    background: '#fff',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.015)',
  }}>
    {/* Cal Header */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '0.7rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontWeight: 800, fontSize: '0.88rem', color: '#1a1a1a',
        borderLeft: `3px solid ${PRIMARY}`, paddingLeft: '0.45rem',
      }}>
        <span>📅</span>
        <span>{monthLabel(calYear, calMonth)}</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#717171' }}>체크인/아웃 순 클릭</span>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button
          onClick={onPrevMonth}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '0.75rem', color: '#717171' }}
        >‹</button>
        <button
          onClick={onNextMonth}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '0.75rem', color: '#717171' }}
        >›</button>
      </div>
    </div>

    {/* Day-of-week header */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '4px' }}>
      {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
        <div key={d} style={{ fontSize: '0.7rem', fontWeight: 700, color: i === 0 ? SECONDARY : i === 6 ? PRIMARY : '#717171', padding: '3px 0' }}>{d}</div>
      ))}
    </div>

    {/* Cells */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
      {cells.map((cell, idx) => {
        if (cell.isEmpty) return <div key={idx} />;
        const isSelected = cell.dateStr === checkIn || cell.dateStr === checkOut;
        const style = getCellStyle(cell, checkIn, checkOut);
        return (
          <div
            key={cell.dateStr}
            onClick={() => onCellClick(cell.dateStr, cell.disabled)}
            style={{
              aspectRatio: '1.05',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              padding: '3px 0',
              position: 'relative',
              ...style,
            }}
          >
            <span style={{
              fontSize: '0.8rem', fontWeight: 700,
              color: isSelected ? '#fff' : cell.disabled ? '#aaa' : cell.isWeekend ? (cells.indexOf(cell) % 7 === 0 ? SECONDARY : PRIMARY) : '#1a1a1a',
              textDecoration: cell.disabled ? 'line-through' : 'none',
            }}>
              {cell.day}
            </span>
            {!cell.disabled && (
              <>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.85)' : '#717171', marginTop: '1px', letterSpacing: '-0.3px' }}>
                  {cell.price / 10000}만
                </span>
                {cell.stock !== undefined && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isSelected ? 'rgba(255,255,255,0.75)' : '#005ce6', marginTop: '1px' }}>
                    {cell.stock}개 남음
                  </span>
                )}
              </>
            )}
            {cell.disabled && (
              <span style={{ fontSize: '0.48rem', fontWeight: 800, color: SECONDARY, marginTop: '1px' }}>예약마감</span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
