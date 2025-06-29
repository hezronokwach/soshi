"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { posts as postsAPI } from "@/lib/api";
import CreatePostComponent from "@/components/posts/CreatePostComponent";
import PostCard from "@/components/posts/PostCard";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  // Fetch posts
  const fetchPosts = async () => {
    try {
      // Using API client - now returns normalized {posts: [...]} structure
      const data = await postsAPI.getPosts(page, 10);
      setPosts(prev => page === 1 ? data.posts : [...prev, ...data.posts]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setIsLoading(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, page]);

  // Handle new post creation
  const handlePostCreated = () => {
    setPage(1);
    fetchPosts();
  };

  return (
    <div className="w-full py-6 lg:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-text-primary mb-2">
          Feed
        </h1>
        <p className="text-lg text-text-secondary">
          Stay connected with your network
        </p>
      </div>

      {/* Create Post Section */}
      {user && (
        <div className="mb-8">
          <CreatePostComponent onPostCreated={handlePostCreated} />
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface border border-border mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
            <p className="text-text-secondary">Loading your feed...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(postId) => {
                setPosts(posts.filter(p => p.id !== postId));
              }}
              onUpdate={(updatedPost) => {
                setPosts(prevPosts =>
                  prevPosts.map(p =>
                    p.id === updatedPost.id ? { ...p, ...updatedPost } : p
                  )
                );
              }}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
              No posts yet
            </h3>
            <p className="text-text-secondary max-w-md mx-auto">
              Be the first to share something with your network! Create a post to get the conversation started.
            </p>
          </div>
        )}

        {/* Load more button */}
        {posts.length > 0 && (
          <div className="text-center pt-8">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="inline-flex items-center px-8 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-all duration-normal hover:shadow-glow hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              Load More Posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}