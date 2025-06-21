// FILE: src/components/groups/GroupPosts.js

'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { groups } from '@/lib/api';

export default function GroupPosts({ params, group, fetchGroup }) {
    const [newPost, setNewPost] = useState('');

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        try {
            await groups.createPost(params.id, { content: newPost });
            setNewPost('');
            fetchGroup(); // Refresh to get new post
        } catch (error) {
            console.error('Error creating post:', error);
        }
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
                        className="w-full p-3 border rounded-md mb-3 bg-background text-white"
                        rows="3"
                    />
                    <Button type="submit" disabled={!newPost.trim()}>
                        Post
                    </Button>
                </form>
            </Card>

            {/* Posts List */}
            {group.posts?.map((post) => (
                <Card key={post.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        {post.avatar ? (
                            <img src={post.avatar} alt={post.first_name} className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                        )}
                        <div>
                            <p className="font-medium text-white">{post.first_name} {post.last_name}</p>
                            <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <p className="mb-3 text-white">{post.content}</p>
                    {post.image_path && (
                        <img src={post.image_path} alt="Post image" className="max-w-full rounded-md" />
                    )}
                </Card>
            ))}
        </div>
    );
}