'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { messages } from '@/lib/api';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import UserSelector from './UserSelector';
import { MessageSquare, Users } from 'lucide-react';

export default function ChatInterface() {
  const { user } = useAuth();
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
    setSelectedConversation(conversation);
    setShowUserSelector(false);
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

  const containerStyles = {
    height: '100%',
    backgroundColor: '#1A2333',
    borderRadius: '1rem',
    border: '1px solid #2A3343',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  };

  const sidebarStyles = {
    width: '320px',
    borderRight: '1px solid #2A3343',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1A2333'
  };

  const sidebarHeaderStyles = {
    padding: '1.5rem',
    borderBottom: '1px solid #2A3343',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const titleStyles = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: "'Outfit', sans-serif"
  };

  const newChatButtonStyles = {
    backgroundColor: '#3A86FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#2D6FD9'
    }
  };

  const mainAreaStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0F1624'
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
