'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { messages, connectWebSocket } from '@/lib/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { MessageSquare, Users } from 'lucide-react';

const GroupChatInterface = ({ group }) => {
  const { user } = useAuth();
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
  const loadMessages = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await messages.getGroupMessages(group.id, pageNum, 50);
      
      if (Array.isArray(response)) {
        if (append) {
          setMessageList(prev => [...response.reverse(), ...prev]);
        } else {
          setMessageList(response.reverse());
          setTimeout(scrollToBottom, 100);
        }
        setHasMore(response.length === 50);
      } else {
        setMessageList([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load group messages:', error);
      setMessageList([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !group) return;

    const handleWebSocketMessage = (data) => {
      if (data.type === 'group_message' && data.group_id === group.id) {
        const newMessage = data.message;
        setMessageList(prev => {
          // Remove any optimistic message with temp ID and replace with real message
          const filteredMessages = prev.filter(msg => !msg.id.toString().startsWith('temp-'));

          // Check if real message already exists (avoid duplicates)
          const exists = filteredMessages.some(msg => msg.id === newMessage.id);
          if (exists) return prev;

          return [...filteredMessages, newMessage];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    // Connect to WebSocket
    wsRef.current = connectWebSocket(handleWebSocketMessage);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, group]);

  // Load initial messages
  useEffect(() => {
    if (group) {
      loadMessages();
    }
  }, [group]);

  // Handle sending messages
  const handleSendMessage = async (content) => {
    if (!content.trim() || sending) return;

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      sender_id: user.id,
      group_id: group.id,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        nickname: user.nickname
      }
    };

    try {
      setSending(true);

      // Add optimistic message immediately
      setMessageList(prev => [...prev, optimisticMessage]);
      scrollToBottom();

      // Send message to backend
      await messages.sendGroupMessage(group.id, content.trim());

      // The real message will come via WebSocket and replace the optimistic one
    } catch (error) {
      console.error('Failed to send group message:', error);
      // Remove optimistic message on error
      setMessageList(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      // You could show an error toast here
    } finally {
      setSending(false);
    }
  };

  // Load more messages when scrolling to top
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      const currentHeight = container.scrollHeight;
      loadMessages(page + 1, true).then(() => {
        setPage(prev => prev + 1);
        // Maintain scroll position
        setTimeout(() => {
          container.scrollTop = container.scrollHeight - currentHeight;
        }, 100);
      });
    }
  };

  if (!group) {
    return (
      <div style={emptyStateStyles}>
        <MessageSquare style={emptyIconStyles} />
        <h3 style={emptyTitleStyles}>No group selected</h3>
        <p style={emptyDescriptionStyles}>
          Select a group to start chatting
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={groupInfoStyles}>
          {group.avatar ? (
            <img 
              src={group.avatar} 
              alt={group.title}
              style={avatarStyles}
            />
          ) : (
            <div style={defaultAvatarStyles}>
              <Users style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
          )}
          <div>
            <h3 style={groupNameStyles}>{group.title}</h3>
            <p style={memberCountStyles}>
              {group.member_count || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        style={messagesContainerStyles}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading && page === 1 ? (
          <div style={loadingStyles}>Loading messages...</div>
        ) : messageList.length === 0 ? (
          <div style={emptyMessagesStyles}>
            <MessageSquare style={emptyIconStyles} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {loading && page > 1 && (
              <div style={loadingMoreStyles}>Loading more messages...</div>
            )}
            {messageList.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user.id}
                showAvatar={
                  index === 0 ||
                  messageList[index - 1].sender_id !== message.sender_id
                }
                showTimestamp={
                  index === messageList.length - 1 ||
                  messageList[index + 1].sender_id !== message.sender_id ||
                  new Date(messageList[index + 1].created_at).getTime() -
                  new Date(message.created_at).getTime() > 300000 // 5 minutes
                }
                isGroupChat={true}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={inputContainerStyles}>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sending}
          placeholder={`Message ${group.title}...`}
        />
      </div>
    </div>
  );
};

// Responsive Styles - Following style-guide.md
const getContainerStyles = () => {
  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#1A2333',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #2A3343'
  };

  // Responsive adjustments
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width <= 640) {
      // Mobile
      baseStyles.borderRadius = '0.5rem';
      baseStyles.height = '100vh';
    } else if (width <= 1024) {
      // Tablet
      baseStyles.borderRadius = '0.625rem';
    }
  }

  return baseStyles;
};

const containerStyles = getContainerStyles();

const getHeaderStyles = () => {
  const baseStyles = {
    padding: '1rem',
    borderBottom: '1px solid #2A3343',
    backgroundColor: '#2A3343',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center'
  };

  // Responsive adjustments
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width <= 640) {
      // Mobile
      baseStyles.padding = '0.75rem';
      baseStyles.minHeight = '70px';
    } else if (width <= 1024) {
      // Tablet
      baseStyles.padding = '0.875rem';
      baseStyles.minHeight = '75px';
    }
  }

  return baseStyles;
};

const headerStyles = getHeaderStyles();

const groupInfoStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const getResponsiveGroupStyles = () => {
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 640;
  const isMediumScreen = typeof window !== 'undefined' && window.innerWidth <= 1024;

  return {
    avatarStyles: {
      width: isSmallScreen ? '2rem' : '2.5rem',
      height: isSmallScreen ? '2rem' : '2.5rem',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    defaultAvatarStyles: {
      width: isSmallScreen ? '2rem' : '2.5rem',
      height: isSmallScreen ? '2rem' : '2.5rem',
      borderRadius: '50%',
      backgroundColor: '#3A86FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF'
    },
    groupNameStyles: {
      margin: 0,
      fontSize: isSmallScreen ? '1rem' : isMediumScreen ? '1.0625rem' : '1.125rem',
      fontWeight: '600',
      color: '#FFFFFF'
    },
    memberCountStyles: {
      margin: 0,
      fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
      color: '#9CA3AF'
    }
  };
};

const groupResponsiveStyles = getResponsiveGroupStyles();
const { avatarStyles, defaultAvatarStyles, groupNameStyles, memberCountStyles } = groupResponsiveStyles;

const messagesContainerStyles = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem 0',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#1A2333', // Plain chat background
  minHeight: 0, // Important for flex child to allow scrolling
  maxHeight: '100%' // Ensure it doesn't exceed container height
};

const inputContainerStyles = {
  padding: '1rem',
  borderTop: '1px solid #2A3343',
  backgroundColor: '#2A3343' // Input area background
};

const loadingStyles = {
  textAlign: 'center',
  padding: '2rem',
  color: '#9CA3AF'
};

const loadingMoreStyles = {
  textAlign: 'center',
  padding: '0.5rem',
  color: '#9CA3AF',
  fontSize: '0.875rem'
};

const emptyMessagesStyles = {
  textAlign: 'center',
  padding: '2rem',
  color: '#9CA3AF'
};

const emptyStateStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '2rem',
  textAlign: 'center'
};

const emptyIconStyles = {
  width: '3rem',
  height: '3rem',
  color: '#d1d5db',
  marginBottom: '1rem'
};

const emptyTitleStyles = {
  margin: '0 0 0.5rem 0',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#374151'
};

const emptyDescriptionStyles = {
  margin: 0,
  color: '#6b7280'
};

export default GroupChatInterface;
