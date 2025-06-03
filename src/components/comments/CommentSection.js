"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

export default function CommentSection({ postId, postOwnerId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  // Fetch comments
  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${postId}/comments?page=${pageNum}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      
      const data = await res.json();
      
      if (pageNum === 1) {
        setComments(data);
      } else {
        setComments(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 20); // Assuming limit is 20
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial comments
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Load more comments
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };

  // Handle new comment creation
  const handleNewComment = async (commentData) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...commentData
        })
      });

      if (!res.ok) throw new Error('Failed to create comment');
      
      const newComment = await res.json();
      setComments(prev => [newComment, ...prev]);
      
      // Notify parent component that a new comment was added
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  // Handle comment update and replies
  const handleCommentUpdate = (updatedComment) => {
    // If the comment has a parent_id, it's a reply
    if (updatedComment.parent_id) {
      setComments(prev => 
        prev.map(comment => {
          // If this is the parent comment, update its replies
          if (comment.id === updatedComment.parent_id) {
            const existingReply = comment.replies?.some(r => r.id === updatedComment.id);
            return {
              ...comment,
              reply_count: (comment.reply_count || 0) + (existingReply ? 0 : 1),
              replies: existingReply 
                ? comment.replies.map(r => r.id === updatedComment.id ? updatedComment : r)
                : [...(comment.replies || []), updatedComment]
            };
          }
          return comment;
        })
      );
    } else {
      // Regular comment update
      setComments(prev => 
        prev.map(comment => 
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );
    }
  };

  // Handle comment deletion
  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  return (
    <div className="mt-4 space-y-4">
      <CommentForm onSubmit={handleNewComment} />
      
      <CommentList 
        comments={comments}
        postOwnerId={postOwnerId}
        onUpdate={handleCommentUpdate}
        onDelete={handleCommentDelete}
      />
      
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 text-sm text-text-secondary hover:text-primary disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}