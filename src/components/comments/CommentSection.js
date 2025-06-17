"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

export default function CommentSection({ postId, postOwnerId, onCommentAdded }) {
  console.log('CommentSection mounted with onCommentAdded:', !!onCommentAdded);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  // Build comment tree from flat comments array
  const buildCommentTree = (comments) => {
    console.log('Building comment tree from:', comments);
    
    // Create a map of comments by ID
    const commentMap = {};
    const commentTree = [];
    
    // First pass: create a map of comments by ID and initialize replies array
    comments.forEach(comment => {
      // Make sure we create a new object to avoid reference issues
      commentMap[comment.id] = { ...comment, replies: [] };
    });
    
    console.log('Comment map after first pass:', commentMap);
    
    // Second pass: build the tree
    Object.values(commentMap).forEach(comment => {
      console.log('Processing comment:', comment.id, 'parent_id:', comment.parent_id);
      
      if (comment.parent_id) {
        // This is a reply, add it to its parent's replies
        if (commentMap[comment.parent_id]) {
          console.log(`Adding comment ${comment.id} as reply to ${comment.parent_id}`);
          commentMap[comment.parent_id].replies.push(comment);
        } else {
          console.warn(`Parent comment ${comment.parent_id} not found for reply ${comment.id}`);
        }
      } else {
        // This is a top-level comment, add it to the tree
        console.log(`Adding top-level comment: ${comment.id}`);
        commentTree.push(comment);
      }
    });
    
    console.log('Comment tree before sorting:', JSON.parse(JSON.stringify(commentTree)));
    
    // Sort top-level comments by date (newest first)
    commentTree.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Sort replies by date (newest first)
    const sortReplies = (comments) => {
      comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          sortReplies(comment.replies);
        }
      });
    };
    
    sortReplies(commentTree);
    
    console.log('Final comment tree:', JSON.parse(JSON.stringify(commentTree)));
    return commentTree;
  };

  // Fetch comments
  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      console.log(`Fetching comments for post ${postId}, page ${pageNum}`);
      
      // First fetch top-level comments
      const [commentsRes, repliesRes] = await Promise.all([
        fetch(`/api/posts/${postId}/comments?page=${pageNum}&parentId=`),
        fetch(`/api/posts/${postId}/comments?parentId=all`) // Special case to get all replies
      ]);
      
      if (!commentsRes.ok) {
        const errorText = await commentsRes.text();
        throw new Error(`Failed to fetch top-level comments: ${commentsRes.status} ${errorText}`);
      }
      if (!repliesRes.ok) {
        const errorText = await repliesRes.text();
        throw new Error(`Failed to fetch replies: ${repliesRes.status} ${errorText}`);
      }
      
      const topLevelComments = await commentsRes.json();
      const allReplies = await repliesRes.json();
      
      console.log(`Fetched ${topLevelComments.length} top-level comments and ${allReplies.length} replies`);
      
      try {
        // Combine and build the comment tree
        const allComments = [...topLevelComments, ...allReplies];
        console.log('Building comment tree from', allComments.length, 'total comments');
        
        const commentTree = buildCommentTree(allComments);
        console.log('Built comment tree with', commentTree.length, 'top-level comments');
        
        if (pageNum === 1) {
          setComments(commentTree);
        } else {
          setComments(prev => [...prev, ...commentTree]);
        }
        
        setHasMore(topLevelComments.length === 20);
      } catch (buildError) {
        console.error('Error building comment tree:', buildError);
        console.error('Top level comments:', topLevelComments);
        console.error('All replies:', allReplies);
        throw new Error(`Error building comment tree: ${buildError.message}`);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      // You might want to show an error message to the user here
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
    console.log('handleNewComment called with:', commentData);
    try {
      const { imageUrl, ...restData } = commentData;
      const requestBody = {
        user_id: user.id,
        ...restData,
        image_url: imageUrl // Convert to snake_case for the backend
      };
      
      console.log('Sending comment data:', requestBody);
      
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create comment');
      }
      
      const newComment = await res.json();
      console.log('Created new comment:', newComment);
      
      // If this is a reply, update the parent comment's replies
      if (newComment.parent_id) {
        setComments(prev => {
          const updateCommentWithReplies = (comments) => {
            return comments.map(comment => {
              // If this is the parent comment, add the new reply
              if (comment.id === newComment.parent_id) {
                console.log(`Adding reply ${newComment.id} to comment ${comment.id}`);
                return {
                  ...comment,
                  replies: [newComment, ...(comment.replies || [])],
                  reply_count: (comment.reply_count || 0) + 1
                };
              }
              
              // If this comment has replies, check them too
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentWithReplies(comment.replies)
                };
              }
              
              return comment;
            });
          };
          
          return updateCommentWithReplies(prev);
        });
      } else {
        // This is a top-level comment, add it to the beginning of the list
        setComments(prev => [newComment, ...prev]);
      }
      
      // Notify parent component that a new comment was added
      console.log('Calling onCommentAdded with new comment:', newComment);
      if (onCommentAdded) {
        onCommentAdded(newComment);
      } else {
        console.warn('onCommentAdded prop is not defined');
      }
      
      return newComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  // Handle comment update and replies
  const handleCommentUpdate = (commentId, updates) => {
    console.log('Updating comment:', commentId, 'with:', updates);
    
    const updateCommentInTree = (comments) => {
      return comments.map(comment => {
        // If this is the comment to update
        if (comment.id === commentId) {
          return { ...comment, ...updates };
        }
        
        // If this comment has replies, check them too
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies)
          };
        }
        
        return comment;
      });
    };
    
    setComments(prev => updateCommentInTree(prev));
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
