"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { upload } from '@/lib/api';
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
        {/* User Avatar with Glass Effect */}
        <div 
          className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white font-medium text-sm shadow-sm"
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          }}
        >
          {user?.first_name?.[0]?.toUpperCase() || 'U'}
        </div>

        {/* Comment Input Container */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className={`w-full p-3 pr-10 bg-background-lighter/70 backdrop-blur-sm rounded-xl border border-border/30 
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent 
                placeholder:text-text-secondary/60 resize-none transition-all duration-200
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              rows={2}
              disabled={isSubmitting}
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              }}
            />
            
            {/* Image Upload Button */}
            <div className="absolute right-2 bottom-2">
              <label className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/30'}`}>
                <ImagePlus size={20} className="text-text-secondary hover:text-primary" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-3 group">
              <div className="relative overflow-hidden rounded-xl border border-border/30 bg-background-lighter/50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-60 w-auto mx-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-background/90 backdrop-blur-sm rounded-full 
                    text-text-secondary hover:text-red-500 transition-colors shadow-md"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex-1">
              {imagePreview && (
                <div className="text-xs text-text-secondary/70">
                  Image attached • {Math.round((image?.size || 0) / 1024)} KB
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg border border-border/30 
                    bg-background/50 hover:bg-accent/30 text-text-secondary hover:text-text 
                    transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !image)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg text-white transition-all duration-200
                  ${(!content.trim() && !image) || isSubmitting 
                    ? 'bg-primary/50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
                `}
                style={{
                  background: (!content.trim() && !image) || isSubmitting 
                    ? 'var(--surface-300)' 
                    : 'linear-gradient(90deg, var(--primary), var(--secondary))'
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                    Posting...
                  </span>
                ) : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}