'use client';

import { useState, useEffect, useRef } from 'react';
import { messages } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { User, MoreVertical } from 'lucide-react';

export default function MessageArea({ conversation, currentUser, onMessagesRead }) {
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const { websocket } = useAuth();

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [conversation]);

  // Listen for new messages and status updates via WebSocket
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
              // Handle message updates and avoid duplicates
              setMessageList(prev => {
                // Check if this is replacing an optimistic message
                const optimisticIndex = prev.findIndex(existingMsg =>
                  existingMsg.id.toString().startsWith('temp-') &&
                  existingMsg.content === message.content &&
                  existingMsg.sender_id === message.sender_id
                );

                if (optimisticIndex !== -1) {
                  // Replace optimistic message with real one
                  const newList = [...prev];
                  newList[optimisticIndex] = message;
                  return newList;
                }

                // Check if message already exists (by ID)
                const messageExists = prev.some(existingMsg =>
                  existingMsg.id === message.id
                );

                if (messageExists) {
                  return prev;
                }

                return [...prev, message];
              });
              scrollToBottom();

              // Mark as read if it's from the other user
              if (message.sender_id === conversation.id) {
                markMessagesAsRead();
              }
            }
          } else if (data.type === 'user_online_status') {
            // Handle online status updates
            if (data.user_id === conversation.id) {
              setIsOnline(data.is_online);
            }
          } else if (data.type === 'typing_indicator') {
            // Handle typing indicators
            if (data.user_id === conversation.id && data.recipient_id === currentUser.id) {
              setIsTyping(data.is_typing);

              // Clear typing indicator after 3 seconds
              if (data.is_typing) {
                if (typingTimeout) clearTimeout(typingTimeout);
                const timeout = setTimeout(() => setIsTyping(false), 3000);
                setTypingTimeout(timeout);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.addEventListener('message', handleMessage);
      return () => {
        websocket.removeEventListener('message', handleMessage);
        if (typingTimeout) clearTimeout(typingTimeout);
      };
    }
  }, [websocket, conversation, currentUser, typingTimeout]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  // Clear typing indicator when conversation changes
  useEffect(() => {
    setIsTyping(false);
    if (typingTimeout) clearTimeout(typingTimeout);
  }, [conversation.id]);

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
    // Add validation to prevent unnecessary API calls
    if (!conversation?.id || !currentUser?.id) {
      console.warn('Cannot mark messages as read: missing conversation or user ID');
      return;
    }

    try {
      console.log('Marking messages as read for conversation:', conversation.id); // Debug log
      const response = await messages.markAsRead(conversation.id);
      console.log('Mark as read response:', response); // Debug log
      // Notify parent component that messages were read
      if (onMessagesRead) {
        onMessagesRead(conversation.id);
      }
    } catch (error) {
      console.error('Failed to mark messages as read for conversation:', conversation.id);
      console.error('Error details:', error.message);
      console.error('Full error:', error);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    // Create optimistic message for immediate UI feedback
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: content.trim(),
      sender_id: currentUser.id,
      recipient_id: conversation.id,
      created_at: new Date().toISOString(),
      is_read: false,
      sender: currentUser
    };

    try {
      setSending(true);
      // Stop typing indicator when message is sent
      sendTypingIndicator(false);

      // Add optimistic message immediately
      setMessageList(prev => [...prev, optimisticMessage]);
      scrollToBottom();

      // Send message to backend
      await messages.sendMessage(conversation.id, content.trim());

      // The real message will come via WebSocket and replace the optimistic one
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessageList(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      // You could show an error toast here
    } finally {
      setSending(false);
    }
  };

  const sendTypingIndicator = (isTyping) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      const typingData = {
        type: 'typing_indicator',
        user_id: currentUser.id,
        recipient_id: conversation.id,
        is_typing: isTyping
      };
      websocket.send(JSON.stringify(typingData));
    }
  };

  const handleInputChange = (isTyping) => {
    sendTypingIndicator(isTyping);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Responsive header styles
  const getHeaderStyles = () => {
    const baseStyles = {
      padding: '1rem',
      borderBottom: '1px solid #2A3343',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      backgroundColor: '#2A3343',
      minHeight: '80px'
    };

    // Responsive adjustments
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 640) {
        // Mobile
        baseStyles.padding = '0.75rem';
        baseStyles.minHeight = '70px';
        baseStyles.gap = '0.5rem';
      } else if (width <= 1024) {
        // Tablet
        baseStyles.padding = '0.875rem';
        baseStyles.minHeight = '75px';
      }
    }

    return baseStyles;
  };

  const headerStyles = getHeaderStyles();

  // Responsive avatar and user info styles
  const getResponsiveStyles = () => {
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 640;
    const isMediumScreen = typeof window !== 'undefined' && window.innerWidth <= 1024;

    return {
      avatarStyles: {
        width: isSmallScreen ? '2rem' : '2.5rem',
        height: isSmallScreen ? '2rem' : '2.5rem',
        borderRadius: '50%',
        backgroundColor: '#3A86FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
        fontWeight: '600',
        position: 'relative'
      },
      avatarImageStyles: {
        width: isSmallScreen ? '2rem' : '2.5rem',
        height: isSmallScreen ? '2rem' : '2.5rem',
        borderRadius: '50%',
        objectFit: 'cover'
      },
      userInfoStyles: {
        flex: 1,
        minWidth: 0
      },
      nameStyles: {
        fontSize: isSmallScreen ? '1rem' : isMediumScreen ? '1.0625rem' : '1.125rem',
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: '0.125rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: isSmallScreen ? 'wrap' : 'nowrap'
      },
      statusStyles: {
        fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
        color: '#B8C1CF'
      }
    };
  };

  const responsiveStyles = getResponsiveStyles();
  const { avatarStyles, avatarImageStyles, userInfoStyles, nameStyles, statusStyles } = responsiveStyles;

  const messagesContainerStyles = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1A2333' // Plain chat background - no pattern
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

  // If this is a message request, block replying until accepted
  const isRequest = conversation.is_request;

  // Accept message request handler
  const handleAcceptRequest = async () => {
    try {
      await messages.acceptMessageRequest(conversation.user.id);
      window.location.reload(); // Reload to update conversation state
    } catch (err) {
      alert('Failed to accept message request.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ position: 'relative' }}>
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
          {/* Online indicator on avatar */}
          {isOnline && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500 border-2 border-surface z-10"
            ></div>
          )}
        </div>

        <div style={userInfoStyles}>
          <div style={nameStyles}>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {conversation.first_name} {conversation.last_name}
            </span>
            {isOnline && (
              <span className="inline-flex items-center text-xs sm:text-sm text-green-500 font-medium flex-shrink-0">
                • online
              </span>
            )}
          </div>
          <div style={statusStyles}>
            {isTyping && conversation.id === conversation.id ? (
              <span style={{ color: '#06D6A0', fontStyle: 'italic' }}>
                typing...
              </span>
            ) : (
              <span>
                {conversation.nickname ? `@${conversation.nickname}` : ''}
              </span>
            )}
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
                key={`message-${message.id || `temp-${index}`}`}
                message={message}
                isOwn={message.sender_id === currentUser.id}
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
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {isRequest ? (
        <div style={{
          padding: '1.5rem',
          textAlign: 'center',
          color: '#B8C1CF',
          background: 'rgba(58,134,255,0.05)',
          borderRadius: '0.75rem',
          margin: '1rem 0'
        }}>
          <p style={{marginBottom: '1rem'}}>This is a message request. Accept to reply.</p>
          <button
            style={{
              background: '#3A86FF',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onClick={handleAcceptRequest}
          >
            Accept Message Request
          </button>
        </div>
      ) : (
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingChange={handleInputChange}
          disabled={sending}
          placeholder={`Message ${conversation.first_name}...`}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
