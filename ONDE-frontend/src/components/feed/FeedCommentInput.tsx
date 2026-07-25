import React from 'react';

interface FeedCommentInputProps {
  isLoggedIn: boolean;
  commentText: string;
  isSecretComment: boolean;
  onCommentTextChange: (value: string) => void;
  onSecretChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const FeedCommentInput: React.FC<FeedCommentInputProps> = ({
  isLoggedIn,
  commentText,
  isSecretComment,
  onCommentTextChange,
  onSecretChange,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="mt-auto pt-2 border-t flex flex-col gap-2">
    <div className="flex gap-2">
      <input
        type="text"
        placeholder={isLoggedIn ? "따뜻한 댓글을 남겨보세요..." : "댓글을 작성하려면 로그인이 필요합니다."}
        value={commentText}
        onChange={(e) => onCommentTextChange(e.target.value)}
        disabled={!isLoggedIn}
        className="flex-1 px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-blue-500"
      />
      <button
        type="submit"
        disabled={!isLoggedIn || !commentText.trim()}
        className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
      >
        등록
      </button>
    </div>
    <div className="flex justify-between items-center px-1">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 cursor-pointer">
        <input
          type="checkbox"
          checked={isSecretComment}
          onChange={(e) => onSecretChange(e.target.checked)}
          disabled={!isLoggedIn}
        />
        비밀 댓글로 등록하기 🔒
      </label>
    </div>
  </form>
);
