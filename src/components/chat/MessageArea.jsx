'use client';

import { useState, useEffect, useRef } from 'react';
import { messages } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { User, MoreVertical } from 'lucide-react';

export default function MessageArea({ conversation, currentUser }) {
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { websocket } = useAuth();

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [conversation]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (websocket) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'private_message' && data.message) {
            const message = data.message;
            // Only add message if it's for this conversation
            if (
              (message.sender_id === conversation.id && message.recipient_id === currentUser.id) ||
              (message.sender_id === currentUser.id && message.recipient_id === conversation.id)
            ) {
              setMessageList(prev => [...prev, message]);
              scrollToBottom();
              
              // Mark as read if it's from the other user
              if (message.sender_id === conversation.id) {
                markMessagesAsRead();
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.addEventListener('message', handleMessage);
      return () => websocket.removeEventListener('message', handleMessage);
    }
  }, [websocket, conversation, currentUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messages.getMessages(conversation.id);
      setMessageList(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessageList([]);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await messages.markAsRead(conversation.id);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    try {
      setSending(true);
      const newMessage = await messages.sendMessage(conversation.id, content.trim());
      // Message will be added via WebSocket, but add optimistically for better UX
      setMessageList(prev => [...prev, newMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could show an error toast here
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const headerStyles = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #2A3343',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#1A2333'
  };

  const avatarStyles = {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    backgroundColor: '#3A86FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: '600'
  };

  const avatarImageStyles = {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    objectFit: 'cover'
  };

  const userInfoStyles = {
    flex: 1
  };

  const nameStyles = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '0.125rem'
  };

  const statusStyles = {
    fontSize: '0.875rem',
    color: '#B8C1CF'
  };

  const messagesContainerStyles = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  };

  const loadingStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#B8C1CF'
  };

  const emptyStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#B8C1CF',
    textAlign: 'center'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={headerStyles}>
        {conversation.avatar ? (
          <img
            src={conversation.avatar}
            alt={`${conversation.first_name} ${conversation.last_name}`}
            style={avatarImageStyles}
          />
        ) : (
          <div style={avatarStyles}>
            {getInitials(conversation.first_name, conversation.last_name)}
          </div>
        )}
        
        <div style={userInfoStyles}>
          <div style={nameStyles}>
            {conversation.first_name} {conversation.last_name}
          </div>
          <div style={statusStyles}>
            {conversation.nickname ? `@${conversation.nickname}` : 'User'}
          </div>
        </div>

        <button style={{
          color: '#B8C1CF',
          padding: '0.5rem',
          borderRadius: '0.375rem',
          transition: 'background-color 0.2s'
        }}>
          <MoreVertical style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
      </div>

      {/* Messages */}
      <div style={messagesContainerStyles}>
        {loading ? (
          <div style={loadingStyles}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              border: '2px solid #2A3343',
              borderTop: '2px solid #3A86FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ marginLeft: '0.5rem' }}>Loading messages...</span>
          </div>
        ) : messageList.length === 0 ? (
          <div style={emptyStyles}>
            <User style={{ width: '3rem', height: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#FFFFFF' }}>
              No messages yet
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              Start the conversation by sending a message below
            </p>
          </div>
        ) : (
          <>
            {messageList.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                isOwn={message.sender_id === currentUser.id}
                showAvatar={
                  index === 0 || 
                  messageList[index - 1].sender_id !== message.sender_id
                }
                user={message.sender_id === currentUser.id ? currentUser : conversation}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sending}
        placeholder={`Message ${conversation.first_name}...`}
      />

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
