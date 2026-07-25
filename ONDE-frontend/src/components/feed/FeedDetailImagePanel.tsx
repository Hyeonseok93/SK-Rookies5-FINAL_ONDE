import React from 'react';
import type { FeedItem } from '@/types/feed';
import { getCategoryLabel } from './feedHelpers';

interface FeedDetailImagePanelProps {
  feed: FeedItem;
}

export const FeedDetailImagePanel: React.FC<FeedDetailImagePanelProps> = ({ feed }) => (
  <div style={{ flex: 1.1, background: '#000', height: '100%', position: 'relative' }}>
    <img
      src={feed.img}
      alt={feed.location}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
    <span className="feed-tag-badge" style={{ bottom: '20px', left: '20px', fontSize: '0.85rem' }}>
      {getCategoryLabel(feed.category)}
    </span>
  </div>
);
