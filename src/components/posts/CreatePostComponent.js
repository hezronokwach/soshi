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

    if (!content.trim() && !image) {
      alert("Please add some content or an image to your post.");
      return;
    }

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
          alert('Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
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
      className="glassmorphism p-8 rounded-xl shadow-xl transition-all duration-normal hover:shadow-2xl"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Create Post</h2>
        <p className="text-text-secondary">Share your thoughts with your network</p>
      </div>

      {/* Post content */}
      <div className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-4 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-normal resize-none"
          placeholder="What's on your mind?"
          rows="4"
        />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-6 relative rounded-xl overflow-hidden shadow-lg">
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
            className="absolute top-3 right-3 bg-error/90 hover:bg-error text-white p-2 rounded-full transition-all duration-normal hover:scale-105 shadow-lg"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Post options */}
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          {/* Image upload */}
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-normal hover:scale-105">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Add image"
            />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Add Image</span>
          </label>

          {/* Privacy selector */}
          <div className="relative">
            <select
              value={privacy}
              onChange={handlePrivacyChange}
              className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-normal appearance-none pr-10 font-medium"
              style={{
                backgroundImage: "url(" + encodeURI("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B8C1CF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") + "" + ")",
                backgroundPosition: "right 0.75rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em"
              }}
            >
              <option value="public" style={{backgroundColor: '#1A2333', color: '#FFFFFF'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#2A3343'} onMouseLeave={(e) => e.target.style.backgroundColor = '#1A2333'}>🌍 Public</option>
              <option value="almost private" style={{backgroundColor: '#1A2333', color: '#FFFFFF'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#2A3343'} onMouseLeave={(e) => e.target.style.backgroundColor = '#1A2333'}>👥 Almost Private</option>
              <option value="private" style={{backgroundColor: '#1A2333', color: '#FFFFFF'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#2A3343'} onMouseLeave={(e) => e.target.style.backgroundColor = '#1A2333'}>🔒 Private</option>
            </select>
            {privacy === 'private' && selectedUsers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-6 min-w-6 flex items-center justify-center px-1 shadow-lg">
                {selectedUsers.length}
              </span>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || (!content.trim() && !image)}
          className="w-full sm:w-auto bg-primary-gradient hover:opacity-90 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-normal disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow hover:scale-105 whitespace-nowrap"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Posting...
            </span>
          ) : (
            "Create Post"
          )}
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
