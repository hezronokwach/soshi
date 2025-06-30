// FILE: src/components/groups/GroupPosts.js

'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { groups, upload } from '@/lib/api';
import { ImagePlus, X, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import GroupPostComments from './GroupPostComments';

export default function GroupPosts({ params, group, fetchGroup }) {
    const [newPost, setNewPost] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState({});
    const [postReactions, setPostReactions] = useState({});

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        setImage(file);
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim() && !image) return;

        try {
            setIsSubmitting(true);
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

            await groups.createPost(params.id, {
                content: newPost,
                image_url: imageUrl
            });

            setNewPost('');
            setImage(null);
            setImagePreview(null);
            fetchGroup(); // Refresh to get new post
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleComments = (postId) => {
        setExpandedComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const handlePostReaction = async (postId, type) => {
        try {
            const res = await fetch(`http://localhost:8080/api/groups/${params.id}/posts/${postId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    reaction_type: type
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update reaction');
            }

            const data = await res.json();
            setPostReactions(prev => ({
                ...prev,
                [postId]: data
            }));
        } catch (error) {
            console.error('Error updating post reaction:', error);
        }
    };

    // Load initial reactions for posts
    const loadPostReactions = async (postId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/groups/${params.id}/posts/${postId}/reactions`, {
                method: 'GET',
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setPostReactions(prev => ({
                    ...prev,
                    [postId]: data
                }));
            }
        } catch (error) {
            console.error('Error loading post reactions:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Post Form */}
            <Card variant="glassmorphism" className="p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-display font-semibold text-text-primary mb-1">Share with the group</h3>
                    <p className="text-text-secondary text-sm">What would you like to discuss?</p>
                </div>
                <form onSubmit={handleCreatePost}>
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full p-4 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-normal resize-none"
                        rows="4"
                        disabled={isSubmitting}
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="relative mb-4">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full max-h-64 rounded-lg border border-border object-cover shadow-lg"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-3 right-3 p-2 bg-error/90 hover:bg-error text-white rounded-full transition-all duration-normal hover:scale-105 shadow-lg"
                                disabled={isSubmitting}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                            {/* Image Upload */}
                            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-normal hover:scale-105">
                                <ImagePlus size={18} />
                                <span className="text-sm font-medium">Add Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={isSubmitting}
                                />
                            </label>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={(!newPost.trim() && !image) || isSubmitting}
                        >
                            {isSubmitting ? 'Posting...' : 'Share Post'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Posts List */}
            {group.posts?.map((post) => {
                // Load reactions for this post if not already loaded
                if (!postReactions[post.id]) {
                    loadPostReactions(post.id);
                }

                const reactions = postReactions[post.id] || { likeCount: 0, dislikeCount: 0, userReaction: null };

                return (
                <Card key={post.id} variant="glassmorphism" hover className="p-6">
                    {/* Post Header */}
                    <div className="flex items-center gap-4 mb-4">
                        {(post.user?.avatar || post.avatar) ? (
                            <img
                                src={post.user?.avatar || post.avatar}
                                alt={`${post.user?.first_name || post.first_name} ${post.user?.last_name || post.last_name}`}
                                className="w-12 h-12 rounded-full object-cover border border-border"
                            />
                        ) : (
                            <div className="w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-lg font-display font-semibold">
                                    {(post.user?.first_name || post.first_name)?.[0]}{(post.user?.last_name || post.last_name)?.[0]}
                                </span>
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-display font-semibold text-text-primary text-lg">
                                {post.user?.first_name || post.first_name} {post.user?.last_name || post.last_name}
                            </p>
                            <p className="text-sm text-text-secondary">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Post Content */}
                    <p className="mb-4 text-text-primary whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>

                    {/* Post Image */}
                    {(post.image_path || post.image_url) && (
                        <div className="mb-3">
                            <img
                                src={getImageUrl(post.image_path || post.image_url)}
                                alt="Post image"
                                className="max-w-full max-h-64 sm:max-h-96 rounded-md border border-border object-cover"
                            />
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 py-2 border-t border-border">
                        <button
                            onClick={() => handlePostReaction(post.id, 'like')}
                            className={`flex items-center gap-1 p-1 sm:p-1.5 rounded-full transition-colors ${
                                reactions.userReaction === 'like'
                                    ? 'text-red-500'
                                    : 'text-text-secondary hover:text-red-500 hover:bg-accent/50'
                            }`}
                            title="Like"
                        >
                            <ThumbsUp
                                size={16}
                                className="sm:w-5 sm:h-5"
                                fill={reactions.userReaction === 'like' ? 'currentColor' : 'none'}
                            />
                            {reactions.likeCount > 0 && (
                                <span className="text-xs sm:text-sm">{reactions.likeCount}</span>
                            )}
                        </button>

                        <button
                            onClick={() => handlePostReaction(post.id, 'dislike')}
                            className={`flex items-center gap-1 p-1 sm:p-1.5 rounded-full transition-colors ${
                                reactions.userReaction === 'dislike'
                                    ? 'text-blue-500'
                                    : 'text-text-secondary hover:text-blue-500 hover:bg-accent/50'
                            }`}
                            title="Dislike"
                        >
                            <ThumbsDown
                                size={16}
                                className="sm:w-5 sm:h-5"
                                fill={reactions.userReaction === 'dislike' ? 'currentColor' : 'none'}
                            />
                            {reactions.dislikeCount > 0 && (
                                <span className="text-xs sm:text-sm">{reactions.dislikeCount}</span>
                            )}
                        </button>

                        <button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-full text-text-secondary hover:text-primary hover:bg-accent/50 transition-colors"
                            title="Comments"
                        >
                            <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">
                                {expandedComments[post.id] ? 'Hide Comments' : 'Comments'}
                            </span>
                        </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments[post.id] && (
                        <GroupPostComments
                            groupId={params.id}
                            groupPostId={post.id}
                            onCommentAdded={() => {
                                // Optionally refresh the group data to update comment counts
                                console.log('Comment added to post', post.id);
                            }}
                        />
                    )}
                </Card>
                );
            })}
        </div>
    );
}