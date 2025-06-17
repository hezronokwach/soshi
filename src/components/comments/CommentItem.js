"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, ThumbsUp, ThumbsDown, Edit, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

export default function CommentItem({ comment, postOwnerId, onUpdate, onDelete }) {
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
  const canDelete = isOwner || user?.id === postOwnerId;

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
    try {
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
      onUpdate(comment.id, updatedComment);
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
        { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }
      
      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
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
        post_id: comment.post_id,
        parent_id: comment.id,
        ...restData,
        image_url: imageUrl
      };

      console.log('Sending reply data:', requestBody);
      
      const res = await fetch(`/api/posts/${comment.post_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) throw new Error('Failed to create reply');
      
      const newReply = await res.json();
      console.log('Created new reply:', newReply);
      
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
      console.error('Error creating reply:', error);
      throw error;
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    try {
      console.log(`Fetching replies for comment ${comment.id}`);
      setIsLoadingReplies(true);
      const res = await fetch(`/api/posts/${comment.post_id}/comments?parentId=${comment.id}`);
      if (!res.ok) throw new Error('Failed to fetch replies');
      const data = await res.json();
      console.log(`Fetched replies for comment ${comment.id}:`, data);
      // Ensure replies are sorted by date (newest first)
      const sortedReplies = [...data].sort((b, a) => new Date(a.created_at) - new Date(b.created_at));
      setReplies(sortedReplies);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
      alert('Failed to load replies. Please try again.');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Debug log comment data
  useEffect(() => {
    if (comment.image_url) {
      console.log('Comment data:', {
        commentId: comment.id,
        imageUrl: comment.image_url,
        fullImageUrl: getImageUrl(comment.image_url),
        commentData: comment
      });
    }
  }, [comment]);

  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white">
        {comment.first_name?.[0] || 'U'}
      </div>

      <div className="flex-1">
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
                <div className="mt-2">
                  <img
                    src={getImageUrl(comment.image_url)}
                    alt="Comment attachment"
                    className="max-h-60 rounded-md"
                    onError={(e) => {
                      console.error('Error loading comment image:', {
                        originalUrl: comment.image_url,
                        processedUrl: getImageUrl(comment.image_url),
                        commentId: comment.id,
                        timestamp: new Date().toISOString()
                      });
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log('Successfully loaded comment image:', getImageUrl(comment.image_url))}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-4 mt-1 px-2">
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

          <button
            onClick={() => {
              setIsReplying(!isReplying);
              if (!showReplies && (comment.reply_count > 0 || replies.length > 0)) {
                loadReplies();
              }
            }}
            className="flex items-center gap-1.5 p-1 rounded-full text-text-secondary hover:text-primary hover:bg-accent/50 transition-colors"
            title="Reply"
          >
            <MessageSquare size={16} strokeWidth={2} />
            <span className="text-sm">Reply</span>
          </button>
        </div>

        {/* Replies section */}
        <div className="mt-2 pl-6 border-l-2 border-border">
          {isReplying && (
            <div className="mt-2">
              <CommentForm 
                postId={comment.post_id}
                parentId={comment.id}
                onSubmit={handleNewReply}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {(comment.reply_count > 0 || replies.length > 0) && (
            <div className="mt-2">
              <button 
                onClick={loadReplies}
                disabled={isLoadingReplies}
                className="text-xs text-text-secondary hover:text-primary flex items-center gap-1"
              >
                {isLoadingReplies ? (
                  'Loading...'
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3" />
                    {showReplies 
                      ? `Hide ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                      : `View ${comment.reply_count || replies.length} ${(comment.reply_count || replies.length) === 1 ? 'reply' : 'replies'}`}
                  </>
                )}
              </button>
              
              {showReplies && replies.length > 0 && (
                <div className="mt-3 space-y-3">
                  {replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postOwnerId={postOwnerId}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
