import React, { useEffect, useState } from 'react';
import type { FeedItem } from '@/types/feed';
import { useTravelStore } from '@/store/useTravelStore';
import {
  fetch_comments_api,
  create_comment_api,
  update_comment_api,
  delete_comment_api,
  update_post_api,
  delete_post_api,
  type CommentDto
} from '@/api/postsApi';
import { FeedDetailImagePanel } from './FeedDetailImagePanel';
import { FeedDetailPostHeader } from './FeedDetailPostHeader';
import { FeedPostEditForm } from './FeedPostEditForm';
import { FeedDetailPostContent } from './FeedDetailPostContent';

interface FeedDetailModalProps {
  feed: FeedItem | null;
  onClose: () => void;
  onFeedUpdated?: (updated: FeedItem) => void;
  onFeedDeleted?: (postId: number) => void;
}

export const FeedDetailModal: React.FC<FeedDetailModalProps> = ({
  feed,
  onClose,
  onFeedUpdated,
  onFeedDeleted
}) => {
  const isLoggedIn = useTravelStore((s) => s.isLoggedIn);
  const username = useTravelStore((s) => s.username);
  const nickname = useTravelStore((s) => s.nickname);
  const addToast = useTravelStore((s) => s.addToast);
  const openAuthModal = useTravelStore((s) => s.openAuthModal);

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSecretComment, setIsSecretComment] = useState(false);

  // Edit Comment state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentSecret, setEditCommentSecret] = useState(false);

  // Edit Post state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postRating, setPostRating] = useState(5);

  // Load comments
  const loadComments = async () => {
    if (!feed) return;
    try {
      const res = await fetch_comments_api(feed.postId);
      if (res.success) {
        setComments(res.data);
      }
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    if (feed) {
      loadComments();
      setPostTitle(feed.location);
      setPostContent(feed.content);
      setPostRating(feed.rating);
      setIsEditingPost(false);
    }
  }, [feed]);

  if (!feed) return null;

  // Submit comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      addToast('댓글을 작성하려면 로그인이 필요합니다.', 'warning');
      openAuthModal();
      return;
    }
    if (!commentText.trim()) return;

    try {
      const res = await create_comment_api(feed.postId, {
        content: commentText,
        isSecret: isSecretComment
      });
      if (res.success) {
        addToast('댓글이 성공적으로 등록되었습니다.', 'success');
        setCommentText('');
        setIsSecretComment(false);
        loadComments();
      } else {
        addToast(res.message || '댓글 등록에 실패했습니다.', 'warning');
      }
    } catch {
      addToast('댓글 등록 중 오류가 발생했습니다.', 'warning');
    }
  };

  // Edit Comment Submit
  const handleCommentUpdateSubmit = async (commentId: number) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await update_comment_api(commentId, {
        content: editCommentText,
        isSecret: editCommentSecret
      });
      if (res.success) {
        addToast('댓글이 수정되었습니다.', 'success');
        setEditingCommentId(null);
        loadComments();
      } else {
        addToast(res.message || '댓글 수정에 실패했습니다.', 'warning');
      }
    } catch {
      addToast('댓글 수정 중 오류가 발생했습니다.', 'warning');
    }
  };

  // Delete comment
  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await delete_comment_api(commentId);
      if (res.success) {
        addToast('댓글이 삭제되었습니다.', 'success');
        loadComments();
      } else {
        addToast(res.message || '댓글 삭제에 실패했습니다.', 'warning');
      }
    } catch {
      addToast('댓글 삭제 중 오류가 발생했습니다.', 'warning');
    }
  };

  // Edit Post Submit
  const handlePostUpdateSubmit = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      addToast('제목과 내용을 입력해주세요.', 'warning');
      return;
    }
    try {
      const res = await update_post_api(feed.postId, {
        title: postTitle,
        content: postContent,
        rating: postRating,
        type: (feed.category as string) === 'ALL' ? 'REVIEW' : (feed.category as any)
      });
      if (res.success) {
        addToast('게시글이 성공적으로 수정되었습니다.', 'success');
        setIsEditingPost(false);
        if (onFeedUpdated) {
          onFeedUpdated({
            ...feed,
            location: postTitle,
            content: postContent,
            rating: postRating
          });
        }
      } else {
        addToast(res.message || '게시글 수정에 실패했습니다.', 'warning');
      }
    } catch {
      addToast('게시글 수정 중 오류가 발생했습니다.', 'warning');
    }
  };

  // Delete Post
  const handlePostDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const res = await delete_post_api(feed.postId);
      if (res.success) {
        addToast('게시글이 삭제되었습니다.', 'success');
        if (onFeedDeleted) {
          onFeedDeleted(feed.postId);
        }
        onClose();
      } else {
        addToast(res.message || '게시글 삭제에 실패했습니다.', 'warning');
      }
    } catch {
      addToast('게시글 삭제 중 오류가 발생했습니다.', 'warning');
    }
  };

  // Check if current user is post author
  const getDisplayName = (name: string) => {
    if (!name) return '';
    return name.includes('@') ? name.split('@')[0] : name;
  };
  const isPostAuthor = username && (nickname ? nickname === feed.author : getDisplayName(username) === feed.author);

  return (
    <div
      className="premium-popup-backdrop"
      style={{ display: 'flex' }}
      onClick={onClose}
    >
      <div
        className="app-modal select-none animate-[zoomIn_0.25s_ease]"
        style={{ width: '1050px', maxWidth: '95%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'row', height: '620px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-xl text-white hover:scale-110 active:scale-95 transition-all text-shadow-[0_1px_4px_black] z-10 bg-none border-none cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <FeedDetailImagePanel feed={feed} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', background: 'white' }}>
          <FeedDetailPostHeader
            feed={feed}
            isPostAuthor={!!isPostAuthor}
            isEditingPost={isEditingPost}
            onEdit={() => setIsEditingPost(true)}
            onDelete={handlePostDelete}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
            {isEditingPost ? (
              <FeedPostEditForm
                postTitle={postTitle}
                postContent={postContent}
                postRating={postRating}
                onTitleChange={setPostTitle}
                onContentChange={setPostContent}
                onRatingChange={setPostRating}
                onCancel={() => setIsEditingPost(false)}
                onSave={handlePostUpdateSubmit}
              />
            ) : (
              <FeedDetailPostContent
                feed={feed}
                comments={comments}
                isLoggedIn={isLoggedIn}
                commentText={commentText}
                isSecretComment={isSecretComment}
                editingCommentId={editingCommentId}
                editCommentText={editCommentText}
                editCommentSecret={editCommentSecret}
                onCommentTextChange={setCommentText}
                onSecretChange={setIsSecretComment}
                onCommentSubmit={handleCommentSubmit}
                onStartEdit={(c) => {
                  setEditingCommentId(c.commentId);
                  setEditCommentText(c.content);
                  setEditCommentSecret(c.isSecret);
                }}
                onCancelEdit={() => setEditingCommentId(null)}
                onEditTextChange={setEditCommentText}
                onEditSecretChange={setEditCommentSecret}
                onSaveEdit={handleCommentUpdateSubmit}
                onDelete={handleCommentDelete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
