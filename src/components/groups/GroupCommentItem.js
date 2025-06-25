"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import GroupCommentForm from './GroupCommentForm';
import GroupCommentList from './GroupCommentList';

export default function GroupCommentItem({ comment, groupId, groupPostId, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [reactions, setReactions] = useState({
    likeCount: comment.like_count || 0,
    dislikeCount: comment.dislike_count || 0,
    userReaction: null
  });
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const isOwner = user?.id === comment.user_id;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

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
    // Save current reactions for rollback in case of error
    const currentReactions = { ...reactions };
    const isRemoving = reactions.userReaction === type;

    // Optimistically update the UI
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
    
    try {
      const res = await fetch(`http://localhost:8080/api/groups/comments/${comment.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reaction_type: type
        })
      });

      if (!res.ok) throw new Error('Failed to update reaction');
      const data = await res.json();
      setReactions(data);
    } catch (error) {
      console.error('Error updating group comment reaction:', error);
      // Rollback to previous reactions on error
      setReactions(currentReactions);
    }
  };

  const handleEdit = async (data) => {
    try {
      const res = await fetch(`http://localhost:8080/api/groups/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          ...data
        })
      });

      if (!res.ok) throw new Error('Failed to update group comment');
      const updatedComment = await res.json();
      onUpdate(comment.id, updatedComment);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating group comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`http://localhost:8080/api/groups/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete group comment');
      }

      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting group comment:', error);
      alert(error.message || 'Failed to delete comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewReply = async (replyData) => {
    try {
      const { imageUrl, ...restData } = replyData;
      const requestBody = {
        user_id: user.id,
        group_post_id: groupPostId,
        parent_id: comment.id,
        ...restData,
        image_url: imageUrl
      };

      console.log('Sending group reply data:', requestBody);
      
      const res = await fetch(`http://localhost:8080/api/groups/${groupId}/posts/${groupPostId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) throw new Error('Failed to create group reply');
      
      const newReply = await res.json();
      console.log('Created new group reply:', newReply);
      
      // Update local state with the new reply
      setReplies(prev => [newReply, ...prev]);
      setShowReplies(true);
      
      // Update the parent comment's reply count
      if (onUpdate) {
        onUpdate(comment.id, { 
          reply_count: (comment.reply_count || 0) + 1 
        });
      }
      
      setIsReplying(false);
      return newReply;
    } catch (error) {
      console.error('Error creating group reply:', error);
      throw error;
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    try {
      console.log(`Fetching replies for group comment ${comment.id}`);
      setIsLoadingReplies(true);
      const res = await fetch(`http://localhost:8080/api/groups/${groupId}/posts/${groupPostId}/comments?parent_id=${comment.id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch group comment replies');
      const data = await res.json();
      console.log(`Fetched replies for group comment ${comment.id}:`, data);
      // Ensure replies are sorted by date (newest first)
      const sortedReplies = [...data].sort((b, a) => new Date(a.created_at) - new Date(b.created_at));
      setReplies(sortedReplies);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading group comment replies:', error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Load user reactions on mount
  useEffect(() => {
    const loadReactions = async () => {
      try {
        const res = await fetch(`/api/groups/comments/${comment.id}/reactions`);
        if (res.ok) {
          const data = await res.json();
          setReactions({
            likeCount: data.like_count || 0,
            dislikeCount: data.dislike_count || 0,
            userReaction: data.user_reaction || null
          });
        }
      } catch (error) {
        console.error('Error loading group comment reactions:', error);
      }
    };

    if (comment.id) {
      loadReactions();
    }
  }, [comment.id]);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 transition-all duration-250 hover:shadow-md">
      {/* Comment Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {comment.user?.avatar ? (
            <img 
              src={getImageUrl(comment.user.avatar)} 
              alt={comment.user.first_name} 
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-text-secondary">
                {comment.user?.first_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text-primary text-sm">
              {comment.user?.first_name} {comment.user?.last_name}
            </span>
            <span className="text-xs text-text-disabled">
              {formatTimestamp(comment.created_at)}
            </span>
          </div>

          {/* Comment Text */}
          {isEditing ? (
            <GroupCommentForm
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              initialContent={comment.content}
              groupId={groupId}
              groupPostId={groupPostId}
            />
          ) : (
            <>
              <p className="text-text-primary text-sm mb-2 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Comment Image */}
              {comment.image_url && (
                <div className="mb-3">
                  <img 
                    src={getImageUrl(comment.image_url)} 
                    alt="Comment attachment" 
                    className="max-w-full max-h-64 rounded-md border border-border object-cover"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions Menu */}
        {isOwner && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-text-secondary hover:text-primary transition-colors duration-150"
              title="Edit comment"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-text-secondary hover:text-error transition-colors duration-150 disabled:opacity-50"
              title="Delete comment"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Comment Actions */}
      {!isEditing && (
        <div className="flex gap-4 mt-1 px-2">
          {/* Like Button */}
          <button
            onClick={() => handleReaction('like')}
            className={`flex items-center gap-1.5 p-1 rounded-full transition-colors ${
              reactions.userReaction === 'like'
                ? 'text-primary'
                : 'text-text-secondary hover:text-primary hover:bg-accent/50'
            }`}
            title="Like"
          >
            <ThumbsUp
              size={16}
              strokeWidth={2}
              fill={reactions.userReaction === 'like' ? 'currentColor' : 'none'}
            />
            <span className="text-sm">
              {reactions.likeCount > 0 ? reactions.likeCount : ''} Like
            </span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={() => handleReaction('dislike')}
            className={`flex items-center gap-1.5 p-1 rounded-full transition-colors ${
              reactions.userReaction === 'dislike'
                ? 'text-primary'
                : 'text-text-secondary hover:text-primary hover:bg-accent/50'
            }`}
            title="Dislike"
          >
            <ThumbsDown
              size={16}
              strokeWidth={2}
              fill={reactions.userReaction === 'dislike' ? 'currentColor' : 'none'}
            />
            <span className="text-sm">
              {reactions.dislikeCount > 0 ? reactions.dislikeCount : ''} Dislike
            </span>
          </button>

          {/* Reply Button */}
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1.5 p-1 rounded-full text-text-secondary hover:text-primary hover:bg-accent/50 transition-colors"
            title="Reply"
          >
            <MessageSquare size={16} strokeWidth={2} />
            <span className="text-sm">Reply</span>
          </button>

          {/* Show Replies Button */}
          {(replies.length > 0 || comment.replies?.length > 0) && (
            <button
              onClick={loadReplies}
              disabled={isLoadingReplies}
              className="text-text-secondary hover:text-primary transition-colors duration-150 disabled:opacity-50"
            >
              {isLoadingReplies ? 'Loading...' : 
                showReplies ? 'Hide replies' : 
                `Show ${replies.length || comment.replies?.length || 0} replies`
              }
            </button>
          )}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="mt-3 pl-11">
          <GroupCommentForm
            onSubmit={handleNewReply}
            onCancel={() => setIsReplying(false)}
            parentId={comment.id}
            groupId={groupId}
            groupPostId={groupPostId}
          />
        </div>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 pl-11 space-y-3">
          <GroupCommentList
            comments={replies}
            groupId={groupId}
            groupPostId={groupPostId}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
