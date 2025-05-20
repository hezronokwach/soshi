"use client";

import { useState } from 'react';
import { MessageCircle, Heart, Share, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, Send } from 'lucide-react';

// Mock data for posts
const MOCK_POSTS = [
  {
    id: 1,
    user: {
      id: 101,
      name: 'Alex Johnson',
      avatar: null,
      username: 'alexj'
    },
    content: 'Just finished working on a new AI project. The results are mind-blowing! #AI #MachineLearning',
    images: [],
    timestamp: '2023-11-15T14:30:00Z',
    likes: 42,
    comments: 8,
    shares: 5,
    liked: false,
    bookmarked: false
  },
  {
    id: 2,
    user: {
      id: 102,
      name: 'Samantha Lee',
      avatar: null,
      username: 'samlee'
    },
    content: 'Exploring the beautiful trails near Mount Rainier today. The views are absolutely breathtaking! 🏔️ #Nature #Hiking',
    images: ['https://images.unsplash.com/photo-1609766857041-ed402ea8e2c2?q=80&w=2070'],
    timestamp: '2023-11-15T12:15:00Z',
    likes: 78,
    comments: 12,
    shares: 3,
    liked: true,
    bookmarked: false
  },
  {
    id: 3,
    user: {
      id: 103,
      name: 'Marcus Chen',
      avatar: null,
      username: 'mchen'
    },
    content: 'Just launched my new portfolio website! Check it out and let me know what you think. #WebDevelopment #Design',
    images: [],
    timestamp: '2023-11-15T10:45:00Z',
    likes: 35,
    comments: 15,
    shares: 2,
    liked: false,
    bookmarked: true
  }
];

export default function FeedPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleBookmark = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          bookmarked: !post.bookmarked
        };
      }
      return post;
    }));
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost = {
      id: Date.now(),
      user: {
        id: 100, // Current user ID (mock)
        name: 'Current User',
        avatar: null,
        username: 'currentuser'
      },
      content: newPostContent,
      images: [],
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  return (
    <div>
      {/* Create Post Section */}
      <div style={{
        backgroundColor: 'rgba(26, 35, 51, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      }}>
        <form onSubmit={handlePostSubmit}>
          <textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0F1624',
              color: '#FFFFFF',
              border: '1px solid #2A3343',
              borderRadius: '0.5rem',
              padding: '1rem',
              minHeight: '100px',
              resize: 'none',
              marginBottom: '1rem',
              outline: 'none'
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button type="button" style={{
                backgroundColor: 'transparent',
                color: '#B8C1CF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}>
                <ImageIcon size={20} />
                <span>Photo</span>
              </button>
              <button type="button" style={{
                backgroundColor: 'transparent',
                color: '#B8C1CF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}>
                <Smile size={20} />
                <span>Feeling</span>
              </button>
            </div>

            <button type="submit" style={{
              backgroundColor: '#3A86FF',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem 1.5rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Send size={18} />
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              backgroundColor: 'rgba(26, 35, 51, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(58, 134, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(58, 134, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {/* Post Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#3A86FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  {post.user.name.charAt(0)}
                </div>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#FFFFFF'
                  }}>
                    {post.user.name}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#B8C1CF'
                  }}>
                    @{post.user.username} • {formatRelativeTime(post.timestamp)}
                  </div>
                </div>
              </div>

              <button style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#B8C1CF',
                cursor: 'pointer'
              }}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Post Content */}
            <div style={{
              marginBottom: '1rem',
              color: '#FFFFFF',
              lineHeight: '1.5'
            }}>
              {post.content}
            </div>

            {/* Post Images */}
            {post.images.length > 0 && (
              <div style={{
                marginBottom: '1rem',
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}>
                <img
                  src={post.images[0]}
                  alt="Post attachment"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            {/* Post Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderTop: '1px solid #2A3343',
              borderBottom: '1px solid #2A3343',
              marginBottom: '1rem',
              color: '#B8C1CF',
              fontSize: '0.875rem'
            }}>
              <span>{post.likes} likes</span>
              <span>{post.comments} comments</span>
              <span>{post.shares} shares</span>
            </div>

            {/* Post Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => handleLike(post.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: post.liked ? '#EF476F' : '#B8C1CF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 71, 111, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Heart size={20} fill={post.liked ? '#EF476F' : 'none'} />
                <span>Like</span>
              </button>

              <button
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#B8C1CF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(17, 138, 178, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.color = '#118AB2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.color = '#B8C1CF';
                }}
              >
                <MessageCircle size={20} />
                <span>Comment</span>
              </button>

              <button
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#B8C1CF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(6, 214, 160, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.color = '#06D6A0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.color = '#B8C1CF';
                }}
              >
                <Share size={20} />
                <span>Share</span>
              </button>

              <button
                onClick={() => handleBookmark(post.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: post.bookmarked ? '#FFD166' : '#B8C1CF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 209, 102, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Bookmark size={20} fill={post.bookmarked ? '#FFD166' : 'none'} />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
