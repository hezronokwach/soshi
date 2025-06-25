"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import GroupCommentForm from './GroupCommentForm';
import GroupCommentList from './GroupCommentList';

export default function GroupPostComments({ groupId, groupPostId, onCommentAdded }) {
  console.log('GroupPostComments mounted with onCommentAdded:', !!onCommentAdded);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  // Build comment tree from flat comments array
  const buildCommentTree = (comments) => {
    console.log('Building group comment tree from:', comments);
    
    // Create a map of comments by ID
    const commentMap = {};
    const commentTree = [];
    
    // First pass: create a map of comments by ID and initialize replies array
    comments.forEach(comment => {
      // Make sure we create a new object to avoid reference issues
      commentMap[comment.id] = { ...comment, replies: [] };
    });
    
    console.log('Group comment map after first pass:', commentMap);
    
    // Second pass: build the tree
    Object.values(commentMap).forEach(comment => {
      console.log('Processing group comment:', comment.id, 'parent_id:', comment.parent_id);
      
      if (comment.parent_id) {
        // This is a reply, add it to its parent's replies
        if (commentMap[comment.parent_id]) {
          console.log(`Adding group comment ${comment.id} as reply to ${comment.parent_id}`);
          commentMap[comment.parent_id].replies.push(comment);
        } else {
          console.warn(`Parent group comment ${comment.parent_id} not found for reply ${comment.id}`);
        }
      } else {
        // This is a top-level comment, add it to the tree
        console.log(`Adding top-level group comment: ${comment.id}`);
        commentTree.push(comment);
      }
    });
    
    console.log('Group comment tree before sorting:', JSON.parse(JSON.stringify(commentTree)));
    
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
    
    console.log('Final group comment tree:', JSON.parse(JSON.stringify(commentTree)));
    return commentTree;
  };

  // Fetch comments
  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      console.log(`Fetching group post comments for post ${groupPostId}, page ${pageNum}`);
      
      // First fetch top-level comments
      const [commentsRes, repliesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/posts/${groupPostId}/comments?page=${pageNum}&parentId=`),
        fetch(`/api/groups/${groupId}/posts/${groupPostId}/comments?parentId=all`) // Special case to get all replies
      ]);
      
      if (!commentsRes.ok) {
        const errorText = await commentsRes.text();
        throw new Error(`Failed to fetch top-level group comments: ${commentsRes.status} ${errorText}`);
      }
      if (!repliesRes.ok) {
        const errorText = await repliesRes.text();
        throw new Error(`Failed to fetch group comment replies: ${repliesRes.status} ${errorText}`);
      }
      
      const topLevelComments = await commentsRes.json();
      const allReplies = await repliesRes.json();
      
      console.log(`Fetched ${topLevelComments.length} top-level group comments and ${allReplies.length} replies`);
      
      try {
        // Combine and build the comment tree
        const allComments = [...topLevelComments, ...allReplies];
        console.log('Building group comment tree from', allComments.length, 'total comments');
        
        const commentTree = buildCommentTree(allComments);
        console.log('Built group comment tree with', commentTree.length, 'top-level comments');
        
        if (pageNum === 1) {
          setComments(commentTree);
        } else {
          setComments(prev => [...prev, ...commentTree]);
        }
        
        setHasMore(topLevelComments.length === 20);
      } catch (buildError) {
        console.error('Error building group comment tree:', buildError);
        console.error('Top level group comments:', topLevelComments);
        console.error('All group replies:', allReplies);
        throw new Error(`Error building group comment tree: ${buildError.message}`);
      }
    } catch (error) {
      console.error('Error fetching group comments:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  // Load initial comments
  useEffect(() => {
    fetchComments();
  }, [groupPostId]);

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
    console.log('handleNewGroupComment called with:', commentData);
    try {
      const { imageUrl, ...restData } = commentData;
      const requestBody = {
        user_id: user.id,
        ...restData,
        image_url: imageUrl // Convert to snake_case for the backend
      };
      
      console.log('Sending group comment data:', requestBody);
      
      const res = await fetch(`/api/groups/${groupId}/posts/${groupPostId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create group comment');
      }
      
      const newComment = await res.json();
      console.log('Created new group comment:', newComment);
      
      // If this is a reply, update the parent comment's replies
      if (newComment.parent_id) {
        setComments(prev => {
          const updateCommentWithReplies = (comments) => {
            return comments.map(comment => {
              // If this is the parent comment, add the new reply
              if (comment.id === newComment.parent_id) {
                console.log(`Adding group reply ${newComment.id} to comment ${comment.id}`);
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
      console.log('Calling onCommentAdded with new group comment:', newComment);
      if (onCommentAdded) {
        onCommentAdded(newComment);
      } else {
        console.warn('onCommentAdded prop is not defined');
      }
      
      return newComment;
    } catch (error) {
      console.error('Error creating group comment:', error);
      throw error;
    }
  };

  // Handle comment update and replies
  const handleCommentUpdate = (commentId, updates) => {
    console.log('Updating group comment:', commentId, 'with:', updates);
    
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
      <GroupCommentForm onSubmit={handleNewComment} groupId={groupId} groupPostId={groupPostId} />
      
      <GroupCommentList 
        comments={comments}
        groupId={groupId}
        groupPostId={groupPostId}
        onUpdate={handleCommentUpdate}
        onDelete={handleCommentDelete}
      />
      
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 text-sm text-text-secondary hover:text-primary disabled:opacity-50 transition-colors duration-250"
        >
          {loading ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
