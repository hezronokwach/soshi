'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { messages } from '@/lib/api';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import UserSelector from './UserSelector';
import { MessageSquare, Users } from 'lucide-react';

export default function ChatInterface() {
  const { user, websocket } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Listen for new messages via WebSocket to update conversation list
  useEffect(() => {
    if (websocket && user) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'private_message' && data.message) {
            const message = data.message;

            // Update conversation list with new message
            setConversations(prev => {
              return prev.map(conv => {
                const convUser = conv.user || conv;

                // If this message is for this conversation
                if (
                  (message.sender_id === convUser.id && message.recipient_id === user.id) ||
                  (message.sender_id === user.id && message.recipient_id === convUser.id)
                ) {
                  // Only increment unread count if message is from other user and conversation is not selected
                  const shouldIncrementUnread =
                    message.sender_id === convUser.id &&
                    (!selectedConversation || selectedConversation.id !== convUser.id);

                  return {
                    ...conv,
                    last_message: message.content,
                    last_message_time: message.created_at,
                    unread_count: shouldIncrementUnread ? (conv.unread_count || 0) + 1 : (conv.unread_count || 0)
                  };
                }
                return conv;
              });
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message in ChatInterface:', error);
        }
      };

      websocket.addEventListener('message', handleMessage);
      return () => {
        websocket.removeEventListener('message', handleMessage);
      };
    }
  }, [websocket, user, selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await messages.getConversations();
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    // Handle both old and new data structures
    const actualConversation = conversation.user || conversation;
    setSelectedConversation(actualConversation);
    setShowUserSelector(false);

    // Immediately update the conversation list to remove unread indicators
    setConversations(prev =>
      prev.map(conv => {
        const convUser = conv.user || conv;
        return (convUser.id === actualConversation.id)
          ? { ...conv, unread_count: 0 }
          : conv;
      })
    );
  };

  const handleNewConversation = (selectedUser) => {
    // Create a new conversation object
    const newConversation = {
      id: selectedUser.id,
      first_name: selectedUser.first_name,
      last_name: selectedUser.last_name,
      avatar: selectedUser.avatar,
      nickname: selectedUser.nickname
    };

    setSelectedConversation(newConversation);
    setShowUserSelector(false);

    // Add to conversations list if not already there
    const exists = conversations.find(conv => conv.id === selectedUser.id);
    if (!exists) {
      setConversations(prev => [newConversation, ...prev]);
    }
  };

  const handleMessagesRead = (conversationId) => {
    // Update conversation list to remove unread count
    setConversations(prev =>
      prev.map(conv => {
        const convUser = conv.user || conv;
        return (convUser.id === conversationId)
          ? { ...conv, unread_count: 0 }
          : conv;
      })
    );
  };

  // Responsive container - matching group chat styling
  const containerStyles = {
    height: '100%',
    backgroundColor: '#1A2333', // Background color from style guide
    borderRadius: '0.75rem',
    border: '1px solid #2A3343', // Border color from style guide
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    flexDirection: 'row',
    minHeight: 0,
  };

  // Responsive sidebar
  const sidebarStyles = {
    width: '100%',
    maxWidth: 360,
    minWidth: 320,
    borderRight: '1px solid #2A3343',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1A2333',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden'
  };

  const sidebarHeaderStyles = {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #2A3343',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.1) 0%, rgba(131, 56, 236, 0.1) 100%)',
    backdropFilter: 'blur(10px)'
  };

  const titleStyles = {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.025em'
  };

  const newChatButtonStyles = {
    backgroundColor: '#3A86FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.625rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(58, 134, 255, 0.2)',
    ':hover': {
      backgroundColor: '#2D6FD9',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(58, 134, 255, 0.3)'
    }
  };

  // Responsive main area
  const mainAreaStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0F1624',
    minWidth: 0,
    width: '100%',
    maxWidth: '900px', // wider chat area on desktop
    margin: '0 auto',
    borderRadius: '0 1rem 1rem 0',
  };

  const emptyStateStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#B8C1CF',
    textAlign: 'center',
    padding: '2rem'
  };

  const emptyIconStyles = {
    width: '4rem',
    height: '4rem',
    marginBottom: '1rem',
    opacity: 0.5
  };

  const emptyTitleStyles = {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#FFFFFF'
  };

  const emptyDescriptionStyles = {
    fontSize: '1rem',
    color: '#B8C1CF',
    marginBottom: '2rem'
  };

  const startChatButtonStyles = {
    backgroundColor: '#3A86FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  // Responsive design for different screen sizes
  const getScreenSize = () => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  };

  const screenSize = getScreenSize();

  // Apply responsive styles
  if (screenSize === 'mobile') {
    // Mobile phones (≤640px)
    containerStyles.flexDirection = 'column';
    containerStyles.height = '100vh';
    containerStyles.borderRadius = 0;
    containerStyles.margin = 0;

    sidebarStyles.width = '100%';
    sidebarStyles.maxWidth = '100%';
    sidebarStyles.height = '40%';
    sidebarStyles.borderRight = 'none';
    sidebarStyles.borderBottom = '1px solid #2A3343';

    mainAreaStyles.width = '100%';
    mainAreaStyles.maxWidth = '100%';
    mainAreaStyles.height = '60%';
    mainAreaStyles.borderRadius = 0;
  } else if (screenSize === 'tablet') {
    // Tablets/iPads (641px - 1024px)
    containerStyles.flexDirection = 'row';
    containerStyles.height = '100%';

    sidebarStyles.width = '35%';
    sidebarStyles.minWidth = '300px';
    sidebarStyles.maxWidth = '400px';

    mainAreaStyles.width = '65%';
    mainAreaStyles.flex = 1;
  } else {
    // Desktop/Laptops (>1024px)
    containerStyles.flexDirection = 'row';
    containerStyles.height = '100%';

    sidebarStyles.width = '30%';
    sidebarStyles.minWidth = '320px';
    sidebarStyles.maxWidth = '380px';

    mainAreaStyles.width = '70%';
    mainAreaStyles.flex = 1;
  }

  if (!user) {
    return (
      <div style={containerStyles}>
        <div style={emptyStateStyles}>
          <MessageSquare style={emptyIconStyles} />
          <h3 style={emptyTitleStyles}>Please log in to access messages</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Sidebar */}
      <div style={sidebarStyles}>
        <div style={sidebarHeaderStyles}>
          <h2 style={titleStyles}>Conversations</h2>
          <button
            style={newChatButtonStyles}
            onClick={() => setShowUserSelector(true)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2D6FD9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3A86FF'}
          >
            <Users style={{ width: '1rem', height: '1rem' }} />
            New
          </button>
        </div>
        
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          loading={loading}
        />
      </div>

      {/* Main Area */}
      <div style={mainAreaStyles}>
        {selectedConversation ? (
          <MessageArea
            conversation={selectedConversation}
            currentUser={user}
            onMessagesRead={handleMessagesRead}
          />
        ) : (
          <div style={emptyStateStyles}>
            <MessageSquare style={emptyIconStyles} />
            <h3 style={emptyTitleStyles}>Select a conversation</h3>
            <p style={emptyDescriptionStyles}>
              Choose a conversation from the sidebar or start a new one
            </p>
            <button
              style={startChatButtonStyles}
              onClick={() => setShowUserSelector(true)}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2D6FD9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3A86FF'}
            >
              <Users style={{ width: '1rem', height: '1rem' }} />
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <UserSelector
          onUserSelect={handleNewConversation}
          onClose={() => setShowUserSelector(false)}
        />
      )}
    </div>
  );
}
