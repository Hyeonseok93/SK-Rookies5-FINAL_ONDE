import React from 'react';

export interface Passenger {
  name: string;
  passportNumber: string;
  birthdate: string;
}

interface FlightPassengerFormCardProps {
  index: number;
  passenger: Passenger;
  onChange: (index: number, field: keyof Passenger, value: string) => void;
}

export const FlightPassengerFormCard: React.FC<FlightPassengerFormCardProps> = ({
  index,
  passenger,
  onChange,
}) => (
  <div
    style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
      transition: 'all 0.25s ease',
    }}
    className="passenger-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        style={{
          background: 'rgba(0, 92, 230, 0.08)',
          color: '#005ce6',
          fontSize: '0.7rem',
          fontWeight: 900,
          padding: '4px 12px',
          borderRadius: '999px',
          letterSpacing: '0.5px',
        }}
      >
        탑승객 {index + 1}
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 750 }}>REQUIRED INFO</span>
    </div>

    {/* 영문 성명 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>
        영문 성명 <span style={{ color: '#ff5a5f' }}>*</span>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, marginLeft: '6px' }}>
          (여권 영문 대문자 입력 예: HONG GILDONG)
        </span>
      </label>
      <input
        type="text"
        value={passenger.name}
        onChange={(e) => onChange(index, 'name', e.target.value)}
        placeholder="HONG GILDONG"
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1.5px solid #cbd5e1',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#1e293b',
          background: '#ffffff',
          outline: 'none',
          transition: 'all 0.2s',
        }}
        className="passenger-input"
      />
    </div>

    {/* 여권번호 및 생년월일 */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>
          여권번호 <span style={{ color: '#ff5a5f' }}>*</span>
        </label>
        <input
          type="text"
          value={passenger.passportNumber}
          onChange={(e) => onChange(index, 'passportNumber', e.target.value.toUpperCase())}
          placeholder="M12345678"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#1e293b',
            background: '#ffffff',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          className="passenger-input"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>
          생년월일 <span style={{ color: '#ff5a5f' }}>*</span>
        </label>
        <input
          type="date"
          value={passenger.birthdate}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => onChange(index, 'birthdate', e.target.value)}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#1e293b',
            background: '#ffffff',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          className="passenger-input"
        />
      </div>
    </div>
  </div>
);
