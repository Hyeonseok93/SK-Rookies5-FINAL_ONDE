import React from 'react';
import type { CommentDto } from '@/api/postsApi';

interface FeedCommentItemProps {
  comment: CommentDto;
  isEditing: boolean;
  editCommentText: string;
  editCommentSecret: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onEditSecretChange: (value: boolean) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

export const FeedCommentItem: React.FC<FeedCommentItemProps> = ({
  comment: c,
  isEditing,
  editCommentText,
  editCommentSecret,
  onStartEdit,
  onCancelEdit,
  onEditTextChange,
  onEditSecretChange,
  onSaveEdit,
  onDelete,
}) => {
  const isCommentOwner = c.isMine === true;

  return (
    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-700">{c.authorName}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            {new Date(c.createdAt).toLocaleString('ko-KR', { hour12: false })}
          </span>
          {c.isSecret && (
            <i className="fa-solid fa-lock text-[10px] text-slate-400" title="비밀 댓글"></i>
          )}
          {isCommentOwner && (
            <div className="flex gap-1.5 ml-1">
              <button
                onClick={onStartEdit}
                className="text-blue-500 hover:text-blue-700 text-[10px] bg-none border-none cursor-pointer"
              >
                수정
              </button>
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-700 text-[10px] bg-none border-none cursor-pointer"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-1 flex flex-col gap-2">
          <textarea
            value={editCommentText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs h-16 resize-none"
          />
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={editCommentSecret}
                onChange={(e) => onEditSecretChange(e.target.checked)}
              />
              비밀 댓글 설정 🔒
            </label>
            <div className="flex gap-1">
              <button
                onClick={onCancelEdit}
                className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-300"
              >
                취소
              </button>
              <button
                onClick={onSaveEdit}
                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700"
              >
                수정 완료
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap">{c.content}</p>
      )}
    </div>
  );
};
