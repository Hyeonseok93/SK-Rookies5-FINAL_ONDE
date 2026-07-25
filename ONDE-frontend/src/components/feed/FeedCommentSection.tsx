import React from 'react';
import type { CommentDto } from '@/api/postsApi';
import { FeedCommentItem } from './FeedCommentItem';
import { FeedCommentInput } from './FeedCommentInput';

interface FeedCommentSectionProps {
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

export const FeedCommentSection: React.FC<FeedCommentSectionProps> = ({
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
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <h4 className="text-xs font-bold text-slate-600 mb-2">댓글 ({comments.length})</h4>
    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.8rem' }} className="space-y-3 pr-1">
      {comments.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs font-bold">
          등록된 댓글이 없습니다.
        </div>
      ) : (
        comments.map((c) => (
          <FeedCommentItem
            key={c.commentId}
            comment={c}
            isEditing={editingCommentId === c.commentId}
            editCommentText={editCommentText}
            editCommentSecret={editCommentSecret}
            onStartEdit={() => onStartEdit(c)}
            onCancelEdit={onCancelEdit}
            onEditTextChange={onEditTextChange}
            onEditSecretChange={onEditSecretChange}
            onSaveEdit={() => onSaveEdit(c.commentId)}
            onDelete={() => onDelete(c.commentId)}
          />
        ))
      )}
    </div>

    <FeedCommentInput
      isLoggedIn={isLoggedIn}
      commentText={commentText}
      isSecretComment={isSecretComment}
      onCommentTextChange={onCommentTextChange}
      onSecretChange={onSecretChange}
      onSubmit={onCommentSubmit}
    />
  </div>
);
