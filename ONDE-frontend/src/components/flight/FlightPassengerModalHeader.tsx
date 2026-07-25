import React from 'react';

interface FlightPassengerModalHeaderProps {
  onClose: () => void;
}

export const FlightPassengerModalHeader: React.FC<FlightPassengerModalHeaderProps> = ({ onClose }) => (
  <div
    style={{
      padding: '1.8rem 2rem 1.4rem 2rem',
      borderBottom: '1px solid #f0f2f5',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}
  >
    <div>
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 900,
          color: '#005ce6',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: '4px',
        }}
      >
        Secure Passenger Boarding Pass
      </span>
      <h3
        style={{
          fontSize: '1.35rem',
          fontWeight: 900,
          color: '#1e293b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <i className="fa-solid fa-passport" style={{ color: '#005ce6' }}></i>
        탑승객 정보 예약 등록
      </h3>
      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 0 0', fontWeight: 500 }}>
        출입국 규정에 근거해 여권 정보와 완전히 동일하게 기재해 주세요.
      </p>
    </div>
    <button
      onClick={onClose}
      style={{
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        transition: 'all 0.2s',
      }}
      className="modal-close-btn"
    >
      <i className="fa-solid fa-xmark" style={{ fontSize: '1.1rem' }}></i>
    </button>
  </div>
);
