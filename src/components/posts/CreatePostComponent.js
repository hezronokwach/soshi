"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { upload } from "@/lib/api";
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
        try {
          const result = await upload.uploadFile(image);
          if (!result || !result.url) {
            throw new Error('Invalid response from server');
          }
          imageUrl = result.url;
        } catch (error) {
          console.error('Upload error:', error);
          throw new Error(error.message || 'Failed to upload image');
        }
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
    <form 
      onSubmit={handleSubmit} 
      className="mb-6 p-6 bg-surface rounded-xl border border-border shadow-lg backdrop-blur-glass"
      style={{
        background: 'rgba(26, 35, 51, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <h2 className="text-2xl font-semibold mb-4 font-display text-text-primary">Create Post</h2>
      
      {/* Post content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-4 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-normal"
        placeholder="What's on your mind?"
        rows="4"
      />

      {/* Image preview */}
      {imagePreview && (
        <div className="mt-4 relative rounded-xl overflow-hidden">
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
            className="absolute top-3 right-3 bg-surface/80 hover:bg-surface text-text-primary p-2 rounded-full transition-normal hover:scale-105"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
        {/* Post options */}
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Image upload */}
          <label className="cursor-pointer flex items-center text-text-secondary hover:text-primary transition-normal">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Add image"
            />
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Add Image</span>
          </label>

          {/* Privacy selector */}
          <div className="relative">
            <select
              value={privacy}
              onChange={handlePrivacyChange}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-normal appearance-none pr-8"
              style={{
                backgroundImage: "url(" + encodeURI("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B8C1CF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") + "" + ")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em"
              }}
            >
              <option value="public" className="bg-surface">Public</option>
              <option value="followers" className="bg-surface">Almost Private</option>
              <option value="private" className="bg-surface">Private</option>
            </select>
            {privacy === 'private' && selectedUsers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {selectedUsers.length}
              </span>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || (!content.trim() && !image)}
          className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-6 rounded-lg transition-normal disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow whitespace-nowrap"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Posting...
            </span>
          ) : 'Post'}
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
