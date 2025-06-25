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
      const res = await fetch(`/api/comments/${comment.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          reaction_type: type
        })
      });

      if (!res.ok) throw new Error('Failed to update reaction');
      const data = await res.json();
      setReactions(data);
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Rollback to previous reactions on error
      setReactions(currentReactions);
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
    <div className="flex gap-3 group">
      {/* User Avatar with Gradient */}
      <div 
        className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white font-medium text-sm shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        }}
      >
        {comment.user?.first_name?.[0]?.toUpperCase() || 'U'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Comment Card with Glass Effect */}
        <div 
          className="bg-background-lighter/70 backdrop-blur-sm rounded-2xl p-4 border border-border/30 shadow-sm transition-all duration-200 hover:shadow-md"
          style={{
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Comment Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className="font-medium text-text truncate">
                  {comment.user?.first_name || 'Unknown'} {comment.user?.last_name || ''}
                </h4>
                {isOwner && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary/80">
                {formatTimestamp(comment.created_at)}
              </p>
            </div>
            
            {/* Comment Actions */}
            {(isOwner || canDelete) && (
              <div className="flex gap-1">
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-accent/30 transition-colors"
                    title="Edit comment"
                    aria-label="Edit comment"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete comment"
                    aria-label="Delete comment"
                  >
                    {isDeleting ? (
                      <span className="inline-block w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></span>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="mt-2">
            {isEditing ? (
              <CommentForm
                onSubmit={handleEdit}
                initialContent={comment.content}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <p className="text-text leading-relaxed break-words">
                  {comment.content}
                </p>
                {comment.image_url && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border/30 bg-background-lighter/50">
                    <div className="relative">
                      <img
                        src={getImageUrl(comment.image_url)}
                        alt="Comment attachment"
                        className="w-full max-h-80 object-contain mx-auto"
                        onError={(e) => {
                          console.error('Error loading comment image:', {
                            originalUrl: comment.image_url,
                            processedUrl: getImageUrl(comment.image_url),
                            commentId: comment.id,
                            timestamp: new Date().toISOString()
                          });
                          e.target.style.display = 'none';
                          // Show error placeholder
                          const container = e.target.parentElement;
                          container.innerHTML = `
                            <div class="p-4 text-center text-text-secondary/70">
                              <div class="mx-auto w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                                <ImageOff size={20} className="text-text-secondary/70" />
                              </div>
                              <p class="text-sm">Image failed to load</p>
                            </div>
                          `;
                        }}
                        onLoad={() => console.log('Successfully loaded comment image:', getImageUrl(comment.image_url))}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/20">
          {/* Like Button */}
          <button
            onClick={() => handleReaction('like')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              reactions.userReaction === 'like'
                ? 'text-primary bg-primary/10'
                : 'text-text-secondary hover:text-primary hover:bg-accent/20'
            }`}
            title="Like"
            aria-label={reactions.userReaction === 'like' ? 'Remove like' : 'Like'}
          >
            <ThumbsUp 
              size={16} 
              strokeWidth={2}
              fill={reactions.userReaction === 'like' ? 'currentColor' : 'none'}
              className="flex-shrink-0"
            />
            {reactions.likeCount > 0 && (
              <span className="text-sm font-medium">
                {reactions.likeCount}
              </span>
            )}
          </button>
          
          {/* Dislike Button */}
          <button
            onClick={() => handleReaction('dislike')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              reactions.userReaction === 'dislike'
                ? 'text-primary bg-primary/10'
                : 'text-text-secondary hover:text-primary hover:bg-accent/20'
            }`}
            title="Dislike"
            aria-label={reactions.userReaction === 'dislike' ? 'Remove dislike' : 'Dislike'}
          >
            <ThumbsDown
              size={16}
              strokeWidth={2}
              fill={reactions.userReaction === 'dislike' ? 'currentColor' : 'none'}
              className="flex-shrink-0"
            />
            {reactions.dislikeCount > 0 && (
              <span className="text-sm font-medium">
                {reactions.dislikeCount}
              </span>
            )}
          </button>

          {/* Reply Button */}
          <button
            onClick={() => {
              setIsReplying(!isReplying);
              if (!showReplies && (comment.reply_count > 0 || replies.length > 0)) {
                loadReplies();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-accent/20 transition-colors"
            title="Reply to this comment"
            aria-expanded={isReplying}
          >
            <MessageSquare size={16} strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm font-medium">Reply</span>
          </button>
        </div>

        {/* Replies Section */}
        <div className="mt-3 pl-4 border-l-2 border-border/30">
          {/* Reply Form */}
          {isReplying && (
            <div className="mb-3">
              <CommentForm 
                postId={comment.post_id}
                parentId={comment.id}
                onSubmit={handleNewReply}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {/* Replies Toggle */}
          {(comment.reply_count > 0 || replies.length > 0) && (
            <div className="mt-2">
              <button 
                onClick={loadReplies}
                disabled={isLoadingReplies}
                className={`flex items-center gap-1.5 text-sm font-medium px-2 py-1.5 rounded-lg transition-colors ${
                  isLoadingReplies 
                    ? 'text-text-secondary/70' 
                    : 'text-text-secondary hover:text-primary hover:bg-accent/20'
                }`}
                aria-expanded={showReplies}
              >
                {isLoadingReplies ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  <>
                    <MessageSquare size={14} className="flex-shrink-0" />
                    <span>
                      {showReplies 
                        ? `Hide ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                        : `View ${comment.reply_count || replies.length} ${(comment.reply_count || replies.length) === 1 ? 'reply' : 'replies'}`}
                    </span>
                  </>
                )}
              </button>
              
              {/* Replies List */}
              {showReplies && replies.length > 0 && (
                <div className="mt-3 space-y-3 pl-1">
                  {replies.map(reply => (
                    <div key={reply.id} className="animate-fadeIn">
                      <CommentItem
                        comment={reply}
                        postOwnerId={postOwnerId}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                      />
                    </div>
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
