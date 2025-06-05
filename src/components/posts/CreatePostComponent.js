"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import SelectFollowersModal from "./SelectFollowersModal";

export default function CreatePostComponent({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const { user } = useAuth();

  const handlePrivacyChange = useCallback((e) => {
    const newPrivacy = e.target.value;
    setPrivacy(newPrivacy);
    
    if (newPrivacy === 'private') {
      setShowFollowersModal(true);
    } else {
      setSelectedUsers([]);
    }
  }, []);

  const handleFollowersSelect = useCallback((selected) => {
    setSelectedUsers(selected);
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      // Store file for upload
      setImage(file);
    } catch (error) {
      console.error("Error handling image:", error);
      alert("Error handling image. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      // Upload image if provided
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

      // Create post
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          content,
          privacy,
          image_url: imageUrl,
          selected_users: privacy === 'private' ? selectedUsers : []
        }),
      });

      if (!postRes.ok) throw new Error("Failed to create post");

      // Reset form
      setContent("");
      setImage(null);
      setImagePreview(null);
      setPrivacy("public");
      setSelectedUsers([]);

      // Notify parent
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-background-lighter rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Create Post</h2>
      
      {/* Post content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="What's on your mind?"
        rows="3"
      />

      {/* Image preview */}
      {imagePreview && (
        <div className="mt-2 relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full max-h-96 object-cover rounded-md"
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
      )}

      <div className="flex items-center justify-between mt-2">
        {/* Post options */}
        <div className="flex gap-4">
          {/* Image upload */}
          <label className="cursor-pointer text-text-secondary hover:text-primary">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <span>Add Image</span>
          </label>

          {/* Privacy selector */}
          <div className="relative">
            <select
              value={privacy}
              onChange={handlePrivacyChange}
              className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="public">Public</option>
              <option value="followers">Almost Private</option>
              <option value="private">Private</option>
            </select>
            {privacy === 'private' && selectedUsers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {selectedUsers.length}
              </span>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || (!content.trim() && !image)}
          className="bg-primary-gradient px-4 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
      
      <SelectFollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        onSave={handleFollowersSelect}
        initialSelected={selectedUsers}
      />
    </form>
  );
}
