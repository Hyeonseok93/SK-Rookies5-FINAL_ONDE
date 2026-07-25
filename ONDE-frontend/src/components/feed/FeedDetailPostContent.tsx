import React from 'react';
import type { FeedItem } from '@/types/feed';
import { renderStars } from './feedHelpers';
import { FeedCommentSection } from './FeedCommentSection';
import type { CommentDto } from '@/api/postsApi';

interface FeedDetailPostContentProps {
  feed: FeedItem;
  comments: CommentDto[];
  isLoggedIn: boolean;
  commentText: string;
  isSecretComment: boolean;
  editingCommentId: number | null;
  editCommentText: string;
  editCommentSecret: boolean;
  onCommentTextChange: (value: string) => void;
  onSecretChange: (value: boolean) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onStartEdit: (comment: CommentDto) => void;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onEditSecretChange: (value: boolean) => void;
  onSaveEdit: (commentId: number) => void;
  onDelete: (commentId: number) => void;
}

export const FeedDetailPostContent: React.FC<FeedDetailPostContentProps> = ({
  feed,
  comments,
  isLoggedIn,
  commentText,
  isSecretComment,
  editingCommentId,
  editCommentText,
  editCommentSecret,
  onCommentTextChange,
  onSecretChange,
  onCommentSubmit,
  onStartEdit,
  onCancelEdit,
  onEditTextChange,
  onEditSecretChange,
  onSaveEdit,
  onDelete,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="text-[#f5b041] text-[12px] mb-2">
      {renderStars(feed.rating)}
    </div>

    <div className="text-slate-700 font-semibold text-sm mb-4 border-b pb-4">
      {feed.content}
    </div>

    <FeedCommentSection
      comments={comments}
      isLoggedIn={isLoggedIn}
      commentText={commentText}
      isSecretComment={isSecretComment}
      editingCommentId={editingCommentId}
      editCommentText={editCommentText}
      editCommentSecret={editCommentSecret}
      onCommentTextChange={onCommentTextChange}
      onSecretChange={onSecretChange}
      onCommentSubmit={onCommentSubmit}
      onStartEdit={onStartEdit}
      onCancelEdit={onCancelEdit}
      onEditTextChange={onEditTextChange}
      onEditSecretChange={onEditSecretChange}
      onSaveEdit={onSaveEdit}
      onDelete={onDelete}
    />
  </div>
);
