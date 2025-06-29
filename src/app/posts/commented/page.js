"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { posts as postsAPI } from "@/lib/api";
import PostCard from "@/components/posts/PostCard";

export default function CommentedPostsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  // Fetch commented posts
  const fetchCommentedPosts = async () => {
    try {
      const data = await postsAPI.getCommentedPosts(page, 10);
      setPosts(prev => page === 1 ? data.posts : [...prev, ...data.posts]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching commented posts:", error);
      setIsLoading(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    if (user) {
      fetchCommentedPosts();
    }
  }, [user, page]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Commented Posts</h1>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
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
          <div className="text-center py-8 text-text-secondary">
            <p>You haven't commented on any posts yet.</p>
          </div>
        )}

        {/* Load more button */}
        {posts.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="text-primary hover:text-primary-dark"
            >
              Load more posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
