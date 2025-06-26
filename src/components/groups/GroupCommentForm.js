"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { upload } from '@/lib/api';
import { ImagePlus, X } from 'lucide-react';

export default function GroupCommentForm({ onSubmit, parentId = null, onCancel, initialContent = '', groupId, groupPostId }) {
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    
    try {
      setIsSubmitting(true);
      let imageUrl = null;

      // Upload image if provided
      if (image) {
        try {
          const result = await upload.uploadFile(image);
          console.log('Upload result:', result);
          if (!result || !result.url) {
            throw new Error('Invalid response from server');
          }
          // Ensure the URL is a full URL if it's not already
          imageUrl = result.url.startsWith('http') ? result.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${result.url}`;
          console.log('Final image URL:', imageUrl);
        } catch (error) {
          console.error('Upload error:', error);
          throw new Error(error.message || 'Failed to upload image');
        }
      }

      const commentData = {
        content: content.trim(),
        imageUrl,
        parent_id: parentId
      };

      console.log('Submitting group comment:', commentData);
      await onSubmit(commentData);
      
      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('Error submitting group comment:', error);
      alert(error.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  if (!user) {
    return (
      <div className="p-4 bg-surface border border-border rounded-lg text-center">
        <p className="text-text-secondary">Please log in to comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.first_name} 
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-text-secondary">
                {user.first_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId ? "Write a reply..." : "Write a comment..."}
            className="w-full p-3 bg-background border border-border rounded-md text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250"
            rows="3"
            disabled={isSubmitting}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-xs max-h-32 rounded-md border border-border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-150"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Image Upload */}
              <label className="cursor-pointer p-2 text-text-secondary hover:text-primary transition-colors duration-150">
                <ImagePlus size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              {/* Cancel Button (for replies) */}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!content.trim() && !image) || isSubmitting}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-250"
              >
                {isSubmitting ? 'Posting...' : (parentId ? 'Reply' : 'Comment')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
