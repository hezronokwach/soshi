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
        <div className="space-y-4 sm:space-y-6">
            {/* Create Post Form */}
            <Card className="p-3 sm:p-4">
                <form onSubmit={handleCreatePost}>
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full p-2 sm:p-3 border rounded-md mb-3 bg-background text-white resize-none text-sm sm:text-base"
                        rows="3"
                        disabled={isSubmitting}
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="relative mb-3">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-w-full max-h-48 sm:max-h-64 rounded-md border border-border object-cover"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                <X size={14} className="sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Image Upload */}
                            <label className="cursor-pointer p-1.5 sm:p-2 text-text-secondary hover:text-primary transition-colors duration-150">
                                <ImagePlus size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                            disabled={(!newPost.trim() && !image) || isSubmitting}
                            className="text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                            {isSubmitting ? 'Posting...' : 'Post'}
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
                <Card key={post.id} className="p-3 sm:p-4">
                    {/* Post Header */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        {post.avatar ? (
                            <img src={post.avatar} alt={post.first_name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
                        ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs sm:text-sm font-medium">
                                    {post.first_name?.[0]}{post.last_name?.[0]}
                                </span>
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm sm:text-base truncate">{post.first_name} {post.last_name}</p>
                            <p className="text-xs sm:text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Post Content */}
                    <p className="mb-2 sm:mb-3 text-white whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{post.content}</p>

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