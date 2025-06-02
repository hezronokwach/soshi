"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function PostCard({ post, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedPrivacy, setEditedPrivacy] = useState(post.privacy || 'public');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.image_url || null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

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
              className="text-text-secondary hover:text-primary"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-text-secondary hover:text-red-500 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
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
              className="w-full p-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="followers">Followers Only</option>
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
      <div className="flex gap-4 text-text-secondary">
        <button className="flex items-center gap-1 hover:text-primary">
          <span>Like</span>
        </button>
        <button className="flex items-center gap-1 hover:text-primary">
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-1 hover:text-primary">
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}