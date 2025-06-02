"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, ThumbsUp, ThumbsDown, MessageSquare, Share2 } from "lucide-react";

export default function PostCard({ post, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedPrivacy, setEditedPrivacy] = useState(post.privacy || 'public');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.image_url || null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactions, setReactions] = useState({
    likeCount: post.like_count || 0,
    dislikeCount: post.dislike_count || 0,
    userReaction: null
  });
  const [isReacting, setIsReacting] = useState(false);
  const { user } = useAuth();

  // Fetch initial reaction status
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/posts/${post.id}/reactions?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setReactions(data))
        .catch(console.error);
    }
  }, [post.id, user?.id]);

  // Update the image preview when the post prop changes
  useEffect(() => {
    setImagePreview(post.image_url || null);
  }, [post.image_url]);

  // Add a timestamp to the image URL to force a refresh
  const getImageUrl = (url) => {
    if (!url) return null;
    return `${url}?t=${new Date().getTime()}`;
  };

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

  const handleUpdate = async () => {
    try {
      let imageUrl = post.image_url || null;

      // Upload new image if provided
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("type", "posts");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload image");
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      // Update post
      const res = await fetch(`/api/posts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          userId: user.id,
          content: editedContent,
          privacy: editedPrivacy,
          image_url: imageUrl,
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
      const res = await fetch(
        `/api/posts?postId=${post.id}&userId=${user.id}`,
        { method: "DELETE" }
      );

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
          userId: user.id,
          reactionType: type
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

  return (
    <div className="p-4 bg-background-lighter rounded-lg shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
            {post.first_name?.[0] || "U"}
          </div>
          <div>
            <h3 className="font-medium">
              {post.first_name} {post.last_name}
            </h3>
            <p className="text-sm text-text-secondary">
              {new Date(post.created_at).toLocaleString()}
              {post.privacy !== "public" && (
                <span className="ml-2 text-xs">
                  ({post.privacy === "followers" ? "Followers" : "Private"})
                </span>
              )}
            </p>
          </div>
        </div>
        {/* Post Actions for Owner */}
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-text-secondary hover:text-primary p-1 rounded-full hover:bg-accent/50"
              title="Edit post"
            >
              <Edit size={18} />
              <span className="sr-only">Edit</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-text-secondary hover:text-red-500 disabled:opacity-50 p-1 rounded-full hover:bg-accent/50"
              title="Delete post"
            >
              <Trash2 size={18} />
              <span className="sr-only">{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      {isEditing ? (
        <div className="mb-3 space-y-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="What's on your mind?"
          />

          {/* Image upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Image (optional)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-md border border-border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-background-lighter p-2 rounded-full hover:bg-background-darker"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors">
                <span className="text-text-secondary">Click to upload an image</span>
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
            <select
              value={editedPrivacy}
              onChange={(e) => setEditedPrivacy(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary appearance-none"
            >
              <option value="public" className="bg-background text-text-primary">Public</option>
              <option value="private" className="bg-background text-text-primary">Private</option>
              <option value="followers" className="bg-background text-text-primary">Followers Only</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setImagePreview(post.image_url || null);
                setImage(null);
              }}
              className="px-4 py-2 text-text-secondary hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="px-4 py-2 bg-primary-gradient rounded-md text-white hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3">{post.content}</p>
      )}

      {/* Post Image */}
      {post.image_url && (
        <div className="relative">
          <img
            key={`post-image-${post.id}-${post.updated_at || ''}`}
            src={getImageUrl(post.image_url)}
            alt="Post"
            className="w-full h-auto rounded-md mb-3"
            onError={(e) => {
              console.error('Error loading image:', post.image_url);
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="flex gap-6 text-text-secondary px-1">
        <button 
          disabled={isReacting}
          onClick={() => handleReaction('like')}
          className={`flex items-center gap-1.5 p-1.5 rounded-full transition-colors ${
            reactions.userReaction === 'like' 
              ? 'text-primary' 
              : 'hover:text-primary hover:bg-accent/50'
          }`}
          title="Like"
        >
          <ThumbsUp
            size={20} 
            strokeWidth={2}
            fill={reactions.userReaction === 'like' ? 'currentColor' : 'none'}
          />
          <span className="text-sm">
            {reactions.likeCount > 0 ? reactions.likeCount : ''} Like
          </span>
        </button>
        
        <button 
          disabled={isReacting}
          onClick={() => handleReaction('dislike')}
          className={`flex items-center gap-1.5 p-1.5 rounded-full transition-colors ${
            reactions.userReaction === 'dislike'
             ? 'text-primary' 
             : 'hover:text-primary hover:bg-accent/50'
          }`}
          title="Dislike"
        >
          <ThumbsDown
            size={20}
            strokeWidth={2}  
            fill={reactions.userReaction === 'dislike' ? 'currentColor' : 'none'}
          />
          <span className="text-sm">
            {reactions.dislikeCount > 0 ? reactions.dislikeCount : ''} Dislike
          </span>
        </button>

        <button 
          className="flex items-center gap-1.5 hover:text-primary p-1.5 rounded-full hover:bg-accent/50 transition-colors"
          title="Comment"
        >
          <MessageSquare size={20} strokeWidth={2} />
          <span className="text-sm">Comment</span>
        </button>
        <button 
          className="flex items-center gap-1.5 hover:text-primary p-1.5 rounded-full hover:bg-accent/50 transition-colors"
          title="Share"
        >
          <Share2 size={20} strokeWidth={2} />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  );
}