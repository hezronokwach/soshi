"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function PostCard({ post, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const isOwner = user?.id === post.user_id;

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/posts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          userId: user.id,
          content: editedContent,
          privacy: post.privacy,
        }),
      });

      if (!res.ok) throw new Error("Failed to update post");

      onUpdate();
      setIsEditing(false);
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
        <div className="mb-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-text-secondary hover:text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-primary-gradient rounded-md text-white hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3">{post.content}</p>
      )}

      {/* Post Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-auto rounded-md mb-3"
        />
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