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
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
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

// Styles
const containerStyles = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  border: '1px solid #e5e7eb'
};

const headerStyles = {
  padding: '1rem',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb'
};

const groupInfoStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const avatarStyles = {
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '50%',
  objectFit: 'cover'
};

const defaultAvatarStyles = {
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '50%',
  backgroundColor: '#e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280'
};

const groupNameStyles = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: '600',
  color: '#111827'
};

const memberCountStyles = {
  margin: 0,
  fontSize: '0.875rem',
  color: '#6b7280'
};

const messagesContainerStyles = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const inputContainerStyles = {
  padding: '1rem',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb'
};

const loadingStyles = {
  textAlign: 'center',
  padding: '2rem',
  color: '#6b7280'
};

const loadingMoreStyles = {
  textAlign: 'center',
  padding: '0.5rem',
  color: '#6b7280',
  fontSize: '0.875rem'
};

const emptyMessagesStyles = {
  textAlign: 'center',
  padding: '2rem',
  color: '#6b7280'
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
