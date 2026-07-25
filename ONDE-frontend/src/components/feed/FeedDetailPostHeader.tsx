import React from 'react';
import type { FeedItem } from '@/types/feed';
import { getCategoryAvatar, formatDate } from './feedHelpers';

interface FeedDetailPostHeaderProps {
  feed: FeedItem;
  isPostAuthor: boolean;
  isEditingPost: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const FeedDetailPostHeader: React.FC<FeedDetailPostHeaderProps> = ({
  feed,
  isPostAuthor,
  isEditingPost,
  onEdit,
  onDelete,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
      <span style={{ fontSize: '2rem', flexShrink: 0, userSelect: 'none' }}>
        {getCategoryAvatar(feed.category)}
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>{feed.author}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', fontWeight: 600 }}>
          <span>{formatDate(feed.date)}</span>
          {!isEditingPost && <span style={{ color: 'var(--text-dark)', fontWeight: 800 }}>{feed.location} 여행</span>}
        </div>
      </div>
    </div>

    {isPostAuthor && !isEditingPost && (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs"
        >
          <i className="fa-solid fa-pen-to-square"></i> 수정
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all font-bold text-xs"
        >
          <i className="fa-solid fa-trash-can"></i> 삭제
        </button>
      </div>
    )}
  </div>
);
