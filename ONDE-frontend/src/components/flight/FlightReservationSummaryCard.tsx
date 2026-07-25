import React from 'react';
import type { FlightDto, AvailableSeat } from '@/store/useFlightStore';
import { format_date, format_time } from './flightFormatters';

interface FlightReservationSummaryCardProps {
  flight: FlightDto;
  seat: AvailableSeat;
  passengerCount: number;
}

export const FlightReservationSummaryCard: React.FC<FlightReservationSummaryCardProps> = ({
  flight,
  seat,
  passengerCount,
}) => (
  <div
    style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
        FLIGHT NO: <strong style={{ color: 'var(--primary)' }}>{flight.flightNumber}</strong>
      </span>
      <span
        style={{
          background: 'rgba(0, 92, 230, 0.08)',
          color: 'var(--primary)',
          fontSize: '0.65rem',
          fontWeight: 900,
          padding: '3px 10px',
          borderRadius: '999px',
        }}
      >
        {seat.classType}
      </span>
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 0',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>출발지</span>
        <strong style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 800, display: 'block' }}>
          {flight.departureAirport}
        </strong>
        {flight.departureTime && (
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '3px', fontWeight: 700 }}>
            {format_date(flight.departureTime)} {format_time(flight.departureTime)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 0.8rem' }}>
        <i className="fa-solid fa-arrow-right" style={{ color: '#94a3b8', fontSize: '0.8rem' }}></i>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>도착지</span>
        <strong style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 800, display: 'block' }}>
          {flight.arrivalAirport}
        </strong>
        {flight.arrivalTime && (
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '3px', fontWeight: 700 }}>
            {format_date(flight.arrivalTime)} {format_time(flight.arrivalTime)}
          </span>
        )}
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
      <span>예약 인원</span>
      <span style={{ color: '#1e293b' }}>성인 {passengerCount}명</span>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
      <span>좌석 1인 기본 요금</span>
      <span style={{ color: '#1e293b' }}>₩{seat.basePrice.toLocaleString()}</span>
    </div>
  </div>
);
