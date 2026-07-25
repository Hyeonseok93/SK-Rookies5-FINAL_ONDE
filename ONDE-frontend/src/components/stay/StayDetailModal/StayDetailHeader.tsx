import React from 'react';
import type { StayDto } from '@/api/stayApi';
import { ListingThumbnail } from '@/components/common/ListingThumbnail';

interface StayDetailHeaderProps {
  stay: StayDto;
}

export const StayDetailHeader: React.FC<StayDetailHeaderProps> = ({ stay }) => (
  <div style={{
    display: 'flex', gap: '1.2rem', marginBottom: '0.8rem',
    alignItems: 'center', borderBottom: '1px solid #ddd',
    paddingBottom: '0.8rem', flexShrink: 0,
  }}>
    <div style={{
      width: '65px', height: '65px', borderRadius: '12px',
      overflow: 'hidden', flexShrink: 0, background: '#f0f2f5',
    }}>
      <ListingThumbnail
        imageUrl={stay.imageUrl}
        alt={stay.title}
        iconClass="fa-hotel"
        className="w-full h-full text-xl"
        imgClassName="w-full h-full object-cover"
      />
    </div>
    <div>
      <h3 style={{
        fontSize: '1.18rem', fontWeight: 800, marginBottom: '0.2rem',
        color: '#1a1a1a', letterSpacing: '-0.5px', lineHeight: 1.3,
      }}>
        {stay.title}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', color: '#717171' }}>
        <span>
          <i className="fa-solid fa-location-dot" />{' '}{stay.location}
        </span>
      </div>
    </div>
  </div>
);
