import React from 'react';

interface StayDetailDescriptionProps {
  description: string;
}

export const StayDetailDescription: React.FC<StayDetailDescriptionProps> = ({ description }) => (
  <div style={{
    fontSize: '0.82rem',
    color: '#4a4a4a',
    lineHeight: 1.55,
    marginBottom: '1rem',
    padding: '0.85rem 1rem',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    whiteSpace: 'pre-wrap',
  }}>
    {description}
  </div>
);
