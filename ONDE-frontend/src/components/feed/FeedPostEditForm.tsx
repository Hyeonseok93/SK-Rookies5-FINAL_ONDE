import React from 'react';

interface FeedPostEditFormProps {
  postTitle: string;
  postContent: string;
  postRating: number;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const FeedPostEditForm: React.FC<FeedPostEditFormProps> = ({
  postTitle,
  postContent,
  postRating,
  onTitleChange,
  onContentChange,
  onRatingChange,
  onCancel,
  onSave,
}) => (
  <div className="space-y-4 pr-1" style={{ display: 'flex', flexDirection: 'column' }}>
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">여행지 / 위치</label>
      <input
        type="text"
        value={postTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-xl text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">만족도 (1~5)</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={`text-xl ${num <= postRating ? 'text-[#f5b041]' : 'text-slate-200'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <label className="block text-xs font-bold text-slate-500 mb-1">내용</label>
      <textarea
        value={postContent}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-xl text-sm h-32 resize-none"
      />
    </div>
    <div className="flex gap-2 justify-end pt-2">
      <button
        onClick={onCancel}
        className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
      >
        취소
      </button>
      <button
        onClick={onSave}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
      >
        저장 완료
      </button>
    </div>
  </div>
);
