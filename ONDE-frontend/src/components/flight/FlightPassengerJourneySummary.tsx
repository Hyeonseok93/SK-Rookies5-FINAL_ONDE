import React from 'react';
import { format_date, format_time } from './flightFormatters';

interface FlightPassengerJourneySummaryProps {
  flightNumber: string;
  classType: string;
  departureAirport: string;
  departureTime?: string;
  arrivalAirport: string;
  arrivalTime?: string;
}

export const FlightPassengerJourneySummary: React.FC<FlightPassengerJourneySummaryProps> = ({
  flightNumber,
  classType,
  departureAirport,
  departureTime,
  arrivalAirport,
  arrivalTime,
}) => (
  <div
    style={{
      background: 'linear-gradient(135deg, rgba(0, 92, 230, 0.03) 0%, rgba(255, 90, 95, 0.03) 100%)',
      border: '1px dashed rgba(0, 92, 230, 0.2)',
      borderRadius: '20px',
      padding: '1.2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      position: 'relative',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
        FLIGHT NO:{' '}
        <strong style={{ color: '#005ce6', fontFamily: 'GmarketSansBold' }}>
          {flightNumber}
        </strong>
      </span>
      <span
        style={{
          background: '#005ce6',
          color: '#ffffff',
          fontSize: '0.65rem',
          fontWeight: 900,
          padding: '3px 10px',
          borderRadius: '999px',
          textTransform: 'uppercase',
        }}
      >
        {classType}
      </span>
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.6rem',
        borderTop: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>ORIGIN</span>
        <strong style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 800, display: 'block' }}>
          {departureAirport}
        </strong>
        {departureTime && (
          <span style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginTop: '2px', fontWeight: 700 }}>
            {format_date(departureTime)} {format_time(departureTime)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 1rem' }}>
        <i className="fa-solid fa-plane" style={{ color: '#005ce6', fontSize: '0.9rem' }}></i>
        <div
          style={{
            height: '2px',
            width: '100%',
            background: 'linear-gradient(90deg, #005ce6 0%, #ff5a5f 100%)',
            margin: '4px 0',
            borderRadius: '99px',
          }}
        />
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>DESTINATION</span>
        <strong style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 800, display: 'block' }}>
          {arrivalAirport}
        </strong>
        {arrivalTime && (
          <span style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginTop: '2px', fontWeight: 700 }}>
            {format_date(arrivalTime)} {format_time(arrivalTime)}
          </span>
        )}
      </div>
    </div>
  </div>
);
