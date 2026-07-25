import React from 'react';

interface FlightPassengerModalActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
}

export const FlightPassengerModalActions: React.FC<FlightPassengerModalActionsProps> = ({
  isSubmitting,
  onClose,
}) => (
  <div
    style={{
      display: 'flex',
      gap: '0.8rem',
      justifyContent: 'flex-end',
      marginTop: '0.5rem',
    }}
  >
    <button
      type="submit"
      disabled={isSubmitting}
      style={{
        padding: '0.8rem 2.2rem',
        border: 'none',
        borderRadius: '12px',
        background: `linear-gradient(135deg, #ff5a5f 0%, #e0484d 100%)`,
        color: '#ffffff',
        fontSize: '0.82rem',
        fontWeight: 900,
        cursor: isSubmitting ? 'wait' : 'pointer',
        boxShadow: '0 4px 12px rgba(255,90,95,0.25)',
        transition: 'all 0.2s',
      }}
      className="submit-btn-action"
    >
      {isSubmitting ? '요청 처리 중...' : '예약 및 결제하기'}
    </button>
    <button
      type="button"
      onClick={onClose}
      style={{
        padding: '0.8rem 1.8rem',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        background: '#ffffff',
        color: '#475569',
        fontSize: '0.82rem',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      className="cancel-btn-action"
    >
      취소
    </button>
  </div>
);
