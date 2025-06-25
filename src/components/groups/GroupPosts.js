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

    return (
        <div className="space-y-6">
            {/* Create Post Form */}
            <Card className="p-4">
                <form onSubmit={handleCreatePost}>
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full p-3 border rounded-md mb-3 bg-background text-white resize-none"
                        rows="3"
                        disabled={isSubmitting}
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="relative mb-3">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-w-full max-h-64 rounded-md border border-border object-cover"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

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

                        <Button
                            type="submit"
                            disabled={(!newPost.trim() && !image) || isSubmitting}
                        >
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Posts List */}
            {group.posts?.map((post) => (
                <Card key={post.id} className="p-4">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-3">
                        {post.avatar ? (
                            <img src={post.avatar} alt={post.first_name} className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {post.first_name?.[0]}{post.last_name?.[0]}
                                </span>
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-white">{post.first_name} {post.last_name}</p>
                            <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Post Content */}
                    <p className="mb-3 text-white whitespace-pre-wrap">{post.content}</p>

                    {/* Post Image */}
                    {(post.image_path || post.image_url) && (
                        <div className="mb-3">
                            <img
                                src={getImageUrl(post.image_path || post.image_url)}
                                alt="Post image"
                                className="max-w-full max-h-96 rounded-md border border-border object-cover"
                            />
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 py-2 border-t border-border">
                        <button
                            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                            title="Like"
                        >
                            <ThumbsUp size={16} />
                            <span className="text-sm">Like</span>
                        </button>

                        <button
                            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                            title="Dislike"
                        >
                            <ThumbsDown size={16} />
                            <span className="text-sm">Dislike</span>
                        </button>

                        <button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                            title="Comments"
                        >
                            <MessageSquare size={16} />
                            <span className="text-sm">
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
            ))}
        </div>
    );
}