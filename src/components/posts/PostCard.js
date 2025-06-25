"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { upload } from "@/lib/api";
import { getImageUrl } from "@/utils/image";
import { Edit, Trash2, ThumbsUp, ThumbsDown, MessageSquare, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import CommentSection from "@/components/comments/CommentSection";
import SelectFollowersModal from "./SelectFollowersModal";

export default function PostCard({ post, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedPrivacy, setEditedPrivacy] = useState(post.privacy || 'public');
  const [selectedUsers, setSelectedUsers] = useState(post.selected_users || []);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.image_url || null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactions, setReactions] = useState({
    likeCount: post.like_count || 0,
    dislikeCount: post.dislike_count || 0,
    userReaction: null
  });
  const [isReacting, setIsReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Use refs to track state that shouldn't trigger re-renders
  const commentCountRef = useRef(0);
  
  // Initialize comment count from post data or use 0 as fallback
  const [commentCount, _setCommentCount] = useState(0);
  
  // Keep ref in sync with state
  const setCommentCount = (newCount) => {
    console.log('Updating comment count from', commentCountRef.current, 'to', newCount);
    commentCountRef.current = newCount;
    _setCommentCount(newCount);
  };
  
  // Set initial comment count when the component mounts or post data changes
  useEffect(() => {
    // First try to get count from post data
    if (post.comment_count !== undefined || post.comments_count !== undefined) {
      const count = post.comment_count || post.comments_count || 0;
      console.log('Setting initial comment count from post data:', count, 'for post:', post.id);
      setCommentCount(count);
    } else {
      // If not in post data, fetch the comments and count them
      const fetchAndCountComments = async () => {
        try {
          const response = await fetch(`/api/posts/${post.id}/comments?limit=100`);
          if (response.ok) {
            const comments = await response.json();
            // Count only top-level comments (replies have parent_id)
            const count = comments.filter(comment => !comment.parent_id).length;
            console.log('Counted comments from API:', count, 'for post:', post.id);
            setCommentCount(count);
          }
        } catch (error) {
          console.error('Error fetching comments for count:', error);
        }
      };
      
      fetchAndCountComments();
    }
  }, [post.id, post.comment_count, post.comments_count]);
  const { user } = useAuth();

  // Fetch initial reaction status and saved status
  useEffect(() => {
    if (user?.id) {
      // Fetch reactions
      fetch(`/api/posts/${post.id}/reactions?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setReactions(data))
        .catch(console.error);
      
      // Check if post is saved
      fetch(`/api/posts/${post.id}/saved`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to check save status');
          return res.json();
        })
        .then(data => setIsSaved(data.isSaved))
        .catch(error => console.error('Error checking save status:', error));
    }
  }, [post.id, user?.id]);

  // Update the image preview when the post prop changes
  useEffect(() => {
    setImagePreview(post.image_url || null);
  }, [post.image_url]);



  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setImage(file);
    } catch (error) {
      console.error("Error handling image:", error);
      alert("Error handling image. Please try again.");
    }
  };

  const isOwner = user?.id === post.user_id;

  const handlePrivacyChange = (e) => {
    const newPrivacy = e.target.value;
    setEditedPrivacy(newPrivacy);
    
    if (newPrivacy === 'private') {
      setShowFollowersModal(true);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleFollowersSelect = (selected) => {
    setSelectedUsers(selected);
  };

  const handleUpdate = async () => {
    try {
      let imageUrl = post.image_url || null;

      // Upload new image if provided
      if (image) {
        const result = await upload.uploadFile(image);
        if (!result || !result.url) {
          throw new Error("Failed to upload image");
        }
        imageUrl = result.url;
      }

      // Update post
      const res = await fetch(`/api/posts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: post.id,
          content: editedContent,
          privacy: editedPrivacy,
          selected_users: post.selected_users || []
        }),
      });

      if (!res.ok) throw new Error("Failed to update post");

      // Create updated post object with the new values
      const updatedPost = {
        ...post,
        content: editedContent,
        privacy: editedPrivacy,
        image_url: imageUrl,
        updated_at: new Date().toISOString() // Force update timestamp
      };

      // Pass the updated post to the parent component
      if (onUpdate) {
        await onUpdate(updatedPost);
      }
      
      // Reset the editing state
      setIsEditing(false);
      setImage(null);
      setImagePreview(imageUrl || null);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Error updating post. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      setIsDeleting(true);
      const res = await fetch('/api/posts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: post.id
        })
      });

      if (!res.ok) throw new Error("Failed to delete post");

      onDelete(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };


  const handleReaction = async (type) => {
    if (!user) return;
    
    setIsReacting(true);
    
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
    
    try {
      const res = await fetch(`/api/posts/${post.id}/reactions`, {
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
      // Rollback on error
      setReactions(prevReactions);
    } finally {
      setIsReacting(false);
    }
  };

  const handleSavePost = async () => {
    if (!user || isSaving) return;
    
    setIsSaving(true);
    const prevSaved = isSaved;
    
    // Optimistic update
    setIsSaved(!prevSaved);
    
    try {
      const url = `/api/posts/${post.id}/save`;
      const method = prevSaved ? 'DELETE' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update save status');
      }
      
      const data = await res.json();
      setIsSaved(data.isSaved);
    } catch (error) {
      console.error('Error updating save status:', error);
      // Rollback on error
      setIsSaved(prevSaved);
      // Optionally show error to user
    } finally {
      setIsSaving(false);
    }
  };

  return (
   <div 
    className="p-6 rounded-xl border border-border/20 shadow-xl backdrop-blur-glass mb-6"
    style={{
      background: 'rgba(26, 35, 51, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}
  >
    {/* Post Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start space-x-3">
        <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center text-white text-lg font-medium shadow-md">
          {post.user?.first_name?.[0] || "U"}
        </div>
        <div>
          <h3 className="font-medium text-text-primary">
            {post.user?.first_name || 'Unknown'} {post.user?.last_name || ''}
          </h3>
          <div className="flex items-center text-sm text-text-secondary">
            <span>{new Date(post.created_at).toLocaleString()}</span>
            {post.privacy !== "public" && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-surface/50 rounded-full border border-border/30">
                {post.privacy === "followers" ? "👥 Followers" : "🔒 Private"}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Post Actions for Owner */}
      {isOwner && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-text-secondary hover:text-primary hover:bg-surface/50 rounded-full transition-normal"
            title="Edit post"
          >
            <Edit size={18} />
            <span className="sr-only">Edit</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-text-secondary hover:text-error disabled:opacity-50 rounded-full hover:bg-surface/50 transition-normal"
            title="Delete post"
          >
            {isDeleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
            <span className="sr-only">{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      )}
    </div>

    {/* Post Content */}
    {isEditing ? (
      <div className="space-y-4 mb-4">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-4 bg-background/80 border border-border/30 rounded-xl text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-normal resize-none"
          rows="3"
          placeholder="What's on your mind?"
        />

        {/* Image upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Image (optional)
          </label>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border/30">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-96 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-3 right-3 bg-surface/90 hover:bg-surface text-text-primary p-2 rounded-full hover:scale-105 transition-normal"
                aria-label="Remove image"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/30 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <ImagePlus className="w-6 h-6 text-text-secondary mb-2" />
              <span className="text-sm text-text-secondary">Click to upload an image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Privacy settings */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Privacy
          </label>
          <div className="relative">
            <select
              value={editedPrivacy}
              onChange={handlePrivacyChange}
              className="w-full p-3 bg-background/80 border border-border/30 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-normal appearance-none pr-10"
              style={{
                backgroundImage: "url(" + encodeURI("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B8C1CF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") + "" + ")",
                backgroundPosition: "right 0.75rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em"
              }}
            >
              <option value="public" className="bg-surface text-text-primary">🌍 Public</option>
              <option value="followers" className="bg-surface text-text-primary">👥 Followers Only</option>
              <option value="private" className="bg-surface text-text-primary">🔒 Private</option>
            </select>
            {editedPrivacy === 'private' && selectedUsers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {selectedUsers.length}
              </span>
            )}
          </div>
        </div>

        <SelectFollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          onSave={handleFollowersSelect}
          initialSelected={selectedUsers}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setImagePreview(post.image_url || null);
              setImage(null);
            }}
            className="px-5 py-2 text-text-secondary hover:text-primary rounded-lg transition-normal"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-normal hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!editedContent.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    ) : (
      <p className="mb-4 text-text-primary whitespace-pre-line">{post.content}</p>
    )}

    {/* Post Image */}
    {post.image_url && (
      <div className="relative rounded-xl overflow-hidden mb-4 border border-border/30">
        <img
          key={`post-image-${post.id}-${post.updated_at || ''}`}
          src={getImageUrl(post.image_url)}
          alt="Post"
          className="w-full h-auto max-h-[600px] object-contain bg-black/5"
          onError={(e) => {
            console.error('Error loading image:', post.image_url);
            e.target.style.display = 'none';
          }}
        />
      </div>
    )}

    {/* Post Actions */}
    <div className="flex flex-wrap gap-1 sm:gap-4 text-text-secondary px-1 pt-2 border-t border-border/20">
      <button 
        disabled={isReacting}
        onClick={() => handleReaction('like')}
        className={`flex items-center gap-1.5 p-2 rounded-xl transition-normal ${
          reactions.userReaction === 'like' 
            ? 'text-primary bg-primary/10' 
            : 'hover:text-primary hover:bg-surface/50'
        }`}
        title="Like"
      >
        <ThumbsUp
          size={20} 
          strokeWidth={2}
          className="transition-transform hover:scale-110"
          fill={reactions.userReaction === 'like' ? 'currentColor' : 'none'}
        />
        <span className="text-sm font-medium">
          {reactions.likeCount > 0 ? reactions.likeCount : 'Like'}
        </span>
      </button>
      
      <button 
        disabled={isReacting}
        onClick={() => handleReaction('dislike')}
        className={`flex items-center gap-1.5 p-2 rounded-xl transition-normal ${
          reactions.userReaction === 'dislike'
            ? 'text-primary bg-primary/10' 
            : 'hover:text-primary hover:bg-surface/50'
        }`}
        title="Dislike"
      >
        <ThumbsDown
          size={20}
          strokeWidth={2}
          className="transition-transform hover:scale-110"
          fill={reactions.userReaction === 'dislike' ? 'currentColor' : 'none'}
        />
        <span className="text-sm font-medium">
          {reactions.dislikeCount > 0 ? reactions.dislikeCount : 'Dislike'}
        </span>
      </button>

      <button 
        onClick={() => setShowComments(!showComments)}
        className={`flex items-center gap-1.5 p-2 rounded-xl transition-normal ${
          showComments 
            ? 'text-primary bg-primary/10' 
            : 'hover:text-primary hover:bg-surface/50'
        }`}
        title="Comment"
      >
        <MessageSquare 
          size={20} 
          strokeWidth={2}
          className="transition-transform hover:scale-110"
        />
        <span className="text-sm font-medium">
          {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
        </span>
      </button>
      
      <button 
        className="flex items-center gap-1.5 p-2 rounded-xl hover:text-primary hover:bg-surface/50 transition-normal"
        title="Share"
      >
        <Share2 
          size={20} 
          strokeWidth={2}
          className="transition-transform hover:scale-110"
        />
        <span className="text-sm font-medium">Share</span>
      </button>

      <button 
        onClick={handleSavePost}
        disabled={isSaving}
        className={`flex items-center gap-1.5 p-2 rounded-xl transition-normal ${
          isSaved 
            ? 'text-yellow-500 bg-yellow-500/10' 
            : 'text-text-secondary hover:text-primary hover:bg-surface/50'
        }`}
        title={isSaved ? 'Remove from saved' : 'Save post'}
      >
        {isSaving ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck size={20} strokeWidth={2} className="transition-transform hover:scale-110" fill="currentColor" />
        ) : (
          <Bookmark size={20} strokeWidth={2} className="transition-transform hover:scale-110" />
        )}
        <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Save'}</span>
      </button>
    </div>

    {/* Comments Section */}
    {showComments && (
      <div className="mt-4 pt-4 border-t border-border/20">
        <CommentSection
          postId={post.id}
          postOwnerId={post.user_id}
          onCommentAdded={(newComment) => {
            console.log('New comment added:', newComment);
            // Only increment if it's a top-level comment (not a reply)
            if (!newComment.parent_id) {
              console.log('Incrementing comment count for post:', post.id);
              const newCount = commentCountRef.current + 1;
              console.log('Updated comment count:', newCount);
              setCommentCount(newCount);
            } else {
              console.log('Not incrementing count - this is a reply');
            }
          }}
        />
      </div>
    )}
    </div>
  );
}