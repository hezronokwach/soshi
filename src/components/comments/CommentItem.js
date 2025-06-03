"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react';
import CommentForm from './CommentForm';

export default function CommentItem({ comment, postOwnerId, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [reactions, setReactions] = useState({
    likeCount: comment.like_count || 0,
    dislikeCount: comment.dislike_count || 0,
    userReaction: null
  });
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const isOwner = user?.id === comment.user_id;
  const canDelete = isOwner || user?.id === postOwnerId;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Convert milliseconds to minutes/hours/days
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleReaction = async (type) => {
    try {
      // Optimistic update
      const prevReactions = { ...reactions };
      const isRemoving = reactions.userReaction === type;

      setReactions(curr => {
        const update = { ...curr };
        if (isRemoving) {
          update[`${type}Count`]--;
          update.userReaction = null;
        } else {
          if (curr.userReaction) {
            update[`${curr.userReaction}Count`]--;
          }
          update[`${type}Count`]++;
          update.userReaction = type;
        }
        return update;
      });

      const res = await fetch(`/api/comments/${comment.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type
        })
      });

      if (!res.ok) throw new Error('Failed to update reaction');
      const data = await res.json();
      setReactions(data);
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Rollback on error
      setReactions(prevReactions);
    }
  };

  const handleEdit = async (data) => {
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...data
        })
      });

      if (!res.ok) throw new Error('Failed to update comment');
      const updatedComment = await res.json();
      onUpdate(updatedComment);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setIsDeleting(true);
      const res = await fetch(
        `/api/comments/${comment.id}?userId=${user.id}&postOwnerId=${postOwnerId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to delete comment');
      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* User Avatar */}
      <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white">
        {comment.first_name?.[0] || 'U'}
      </div>

      <div className="flex-1">
        {/* Comment Content */}
        <div className="bg-background-lighter rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium">
                {comment.first_name} {comment.last_name}
              </h4>
              <p className="text-xs text-text-secondary">
                {formatTimestamp(comment.created_at)}
              </p>
            </div>
            
            {/* Comment Actions */}
            {(isOwner || canDelete) && (
              <div className="flex gap-1">
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 text-text-secondary hover:text-primary rounded-full hover:bg-accent/50"
                    title="Edit comment"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1 text-text-secondary hover:text-red-500 rounded-full hover:bg-accent/50 disabled:opacity-50"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <CommentForm
              onSubmit={handleEdit}
              initialContent={comment.content}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <p className="mb-2">{comment.content}</p>
              {comment.image_url && (
                <img
                  src={comment.image_url}
                  alt="Comment attachment"
                  className="max-h-60 rounded-md"
                />
              )}
            </>
          )}
        </div>

        {/* Comment Actions */}
        <div className="flex gap-4 mt-1 px-2">
          <button
            onClick={() => handleReaction('like')}
            className={`flex items-center gap-1 text-sm ${
              reactions.userReaction === 'like'
                ? 'text-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            <ThumbsUp size={14} />
            {reactions.likeCount > 0 && reactions.likeCount}
          </button>
          
          <button
            onClick={() => handleReaction('dislike')}
            className={`flex items-center gap-1 text-sm ${
              reactions.userReaction === 'dislike'
                ? 'text-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            <ThumbsDown size={14} />
            {reactions.dislikeCount > 0 && reactions.dislikeCount}
          </button>

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
          >
            <MessageSquare size={14} />
            Reply
          </button>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-2">
            <CommentForm
              parentId={comment.id}
              onSubmit={onUpdate}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {/* Show Replies */}
        {comment.reply_count > 0 && !showReplies && (
          <button
            onClick={() => setShowReplies(true)}
            className="mt-2 text-sm text-text-secondary hover:text-primary"
          >
            Show {comment.reply_count} replies
          </button>
        )}
      </div>
    </div>
  );
}