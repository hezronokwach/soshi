'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/components/posts/PostCard';
import { Loader2 } from 'lucide-react';

export default function SavedPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    hasMore: false,
  });

  const fetchSavedPosts = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/posts/saved?page=${page}&limit=${pagination.limit}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch saved posts');
      }

      const data = await response.json();
      
      setPosts(prev => page === 1 ? data.posts : [...prev, ...data.posts]);
      setPagination(prev => ({
        ...prev,
        page,
        hasMore: data.hasMore,
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching saved posts:', err);
      setError('Failed to load saved posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSavedPosts(1);
    }
  }, [user]);

  const handleLoadMore = () => {
    if (!isLoading && pagination.hasMore) {
      fetchSavedPosts(pagination.page + 1);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Please sign in to view saved posts</p>
      </div>
    );
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => fetchSavedPosts(1)}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Retry'}
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <div className="bg-accent/20 p-4 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-yellow-500"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
        <p className="text-text-secondary max-w-md">
          Save posts you want to check out later by clicking the bookmark icon on any post.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Saved Posts</h1>
        <p className="text-text-secondary">Posts you've saved for later</p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {pagination.hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-accent/50 hover:bg-accent/70 rounded-md text-sm font-medium transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
