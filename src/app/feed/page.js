"use client";

import { useState } from "react";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Feed</h1>

      {/* Create Post Section */}
      <div className="mb-6 p-4 bg-background-lighter rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Create Post</h2>
        <textarea
          className="w-full p-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="What's on your mind?"
          rows="3"
        />
        <div className="flex justify-end mt-2">
          <button className="bg-primary-gradient px-4 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity">
            Post
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="p-4 bg-background-lighter rounded-lg shadow">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                  {post.user.first_name[0]}
                </div>
                <div>
                  <h3 className="font-medium">{post.user.first_name} {post.user.last_name}</h3>
                  <p className="text-sm text-text-secondary">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className="mb-3">{post.content}</p>
              {post.image && (
                <img src={post.image} alt="Post" className="w-full h-auto rounded-md mb-3" />
              )}
              <div className="flex gap-4 text-text-secondary">
                <button className="flex items-center gap-1 hover:text-primary">
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1 hover:text-primary">
                  <span>Comment</span>
                </button>
                <button className="flex items-center gap-1 hover:text-primary">
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <p>No posts yet. Be the first to post something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
