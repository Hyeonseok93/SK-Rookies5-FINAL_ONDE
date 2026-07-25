import React from 'react';

export const FlightPassengerModalStyles: React.FC = () => (
  <style>{`
    @keyframes modalSlideUp {
      from { transform: translateY(30px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .modal-close-btn:hover {
      background: #e2e8f0 !important;
      color: #0f172a !important;
    }
    .passenger-card:hover {
      border-color: #005ce6 !important;
      box-shadow: 0 8px 20px rgba(0, 92, 230, 0.04);
    }
    .passenger-input:focus {
      border-color: #005ce6 !important;
      box-shadow: 0 0 0 3px rgba(0, 92, 230, 0.1) !important;
      background: #ffffff !important;
    }
    .cancel-btn-action:hover {
      background: #f8fafc !important;
      color: #1e293b !important;
    }
    .submit-btn-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(255,90,95,0.35) !important;
    }
    .submit-btn-action:active {
      transform: translateY(1px);
    }
    .passenger-modal-body::-webkit-scrollbar {
      width: 6px;
    }
    .passenger-modal-body::-webkit-scrollbar-track {
      background: #f8fafc;
    }
    .passenger-modal-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 99px;
    }
    .passenger-modal-body::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `}</style>
);
