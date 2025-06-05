"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ImagePlus, X } from 'lucide-react';

export default function CommentForm({ onSubmit, parentId = null, onCancel, initialContent = '' }) {
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
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'comments');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      // Submit comment
      await onSubmit({
        content: content.trim(),
        imageUrl,
        parentId
      });

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);

      // Close reply form if applicable
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
          {user?.first_name?.[0] || 'U'}
        </div>

        {/* Comment Input */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
            disabled={isSubmitting}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-40 rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-1 right-1 p-1 bg-background-lighter rounded-full hover:bg-accent/50"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <label className="cursor-pointer text-text-secondary hover:text-primary">
                <ImagePlus size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1 text-sm text-text-secondary hover:text-primary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !image)}
                className="px-3 py-1 bg-primary-gradient text-white rounded-md hover:opacity-90 disabled:opacity-50 text-sm"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}