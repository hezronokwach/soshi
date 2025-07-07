"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { posts as postsAPI, users as usersAPI, activity as activityAPI } from "../../lib/api";
import CreatePostComponent from "../../components/posts/CreatePostComponent";
import PostCard from "../../components/posts/PostCard";
import { Home, TrendingUp, Users, MessageCircle, Loader2 } from 'lucide-react';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [networkCount, setNetworkCount] = useState(0);
  const [engagementCount, setEngagementCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);
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

  // Fetch network and engagement counts
  const fetchCounts = async () => {
    try {
      setCountsLoading(true);
      
      // Get network count (followers + following)
      const counts = await usersAPI.getFollowCounts();
      const totalConnections = counts.followers + counts.following;
      setNetworkCount(totalConnections);
      
      // Get engagement count (recent activities in the last week)
      const activities = await activityAPI.getUserActivities(null, {
        page: 1,
        limit: 100
      });
      
      // Filter activities from the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyEngagement = activities.activities?.filter(activity => {
        const activityDate = new Date(activity.created_at);
        return activityDate >= oneWeekAgo;
      }).length || 0;
      
      setEngagementCount(weeklyEngagement);
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setCountsLoading(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, page]);

  // Load counts only once when user is available
  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  // Handle new post creation
  const handlePostCreated = (newPost) => {
    if (newPost) {
      setPosts(prev => [newPost, ...prev]);
      // Refresh counts since there's a new post
      fetchCounts();
    } else {
      setPage(1);
      fetchPosts();
    }
  };

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#3A86FF] to-[#8338EC] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(58,134,255,0.3)]">
            <Home size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFFFFF] mb-1 font-display">
              Feed
            </h1>
            <p className="text-base sm:text-lg text-[#B8C1CF] font-sans">
              Stay connected with your network
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-[#1A2333]/80 backdrop-blur-sm border border-[#2A3343] rounded-lg p-3 sm:p-4 hover:bg-[#1A2333] transition-all duration-250 hover:scale-105">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-[#3A86FF]" />
              <span className="text-sm font-medium text-[#B8C1CF] font-sans">Activity</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#FFFFFF] font-display">{posts.length}</p>
            <p className="text-xs text-[#6C7A89] font-sans">Posts in feed</p>
          </div>
          
          <div className="bg-[#1A2333]/80 backdrop-blur-sm border border-[#2A3343] rounded-lg p-3 sm:p-4 hover:bg-[#1A2333] transition-all duration-250 hover:scale-105">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-[#8338EC]" />
              <span className="text-sm font-medium text-[#B8C1CF] font-sans">Network</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#FFFFFF] font-display">
              {countsLoading ? '...' : networkCount}
            </p>
            <p className="text-xs text-[#6C7A89] font-sans">Connections</p>
          </div>
          
          <div className="bg-[#1A2333]/80 backdrop-blur-sm border border-[#2A3343] rounded-lg p-3 sm:p-4 hover:bg-[#1A2333] transition-all duration-250 hover:scale-105">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={16} className="text-[#FF006E]" />
              <span className="text-sm font-medium text-[#B8C1CF] font-sans">Engagement</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#FFFFFF] font-display">
              {countsLoading ? '...' : engagementCount}
            </p>
            <p className="text-xs text-[#6C7A89] font-sans">This week</p>
          </div>
        </div>
      </div>

      {/* Create Post Section */}
      {user && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-[#1A2333]/90 backdrop-blur-sm border border-[#2A3343] rounded-xl p-1 shadow-xl">
            <CreatePostComponent onPostCreated={handlePostCreated} />
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-[#1A2333]/80 backdrop-blur-sm border border-[#2A3343] rounded-xl p-6 sm:p-8 shadow-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#3A86FF] to-[#8338EC] mb-4 sm:mb-6 shadow-[0_0_20px_rgba(58,134,255,0.3)]">
                <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#FFFFFF] mb-2 font-display">Loading your feed...</h3>
              <p className="text-sm sm:text-base text-[#B8C1CF] font-sans">Fetching the latest posts from your network</p>
            </div>
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
          <div className="text-center py-12 sm:py-16">
            <div className="bg-[#1A2333]/80 backdrop-blur-sm border border-[#2A3343] rounded-xl p-8 sm:p-12 shadow-xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-[#3A86FF] to-[#8338EC] flex items-center justify-center shadow-[0_0_20px_rgba(58,134,255,0.3)]">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mb-3 font-display">
                No posts yet
              </h3>
              <p className="text-sm sm:text-base text-[#B8C1CF] max-w-md mx-auto mb-4 sm:mb-6 font-sans">
                Be the first to share something with your network! Create a post to get the conversation started.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-[#3A86FF]/20 text-[#3A86FF] rounded-full text-xs sm:text-sm font-medium">Share thoughts</span>
                <span className="px-3 py-1 bg-[#8338EC]/20 text-[#8338EC] rounded-full text-xs sm:text-sm font-medium">Upload photos</span>
                <span className="px-3 py-1 bg-[#FF006E]/20 text-[#FF006E] rounded-full text-xs sm:text-sm font-medium">Connect</span>
              </div>
            </div>
          </div>
        )}

        {/* Load more button */}
        {posts.length > 0 && posts.length >= 10 && (
          <div className="text-center pt-6 sm:pt-8">
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#3A86FF] to-[#8338EC] hover:shadow-[0_0_20px_rgba(58,134,255,0.5)] text-white font-medium rounded-xl transition-all duration-250 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:ring-offset-2 focus:ring-offset-[#0F1624] font-sans text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
              )}
              <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Load More Posts'}</span>
              <span className="sm:hidden">{isLoading ? 'Loading...' : 'Load More'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}