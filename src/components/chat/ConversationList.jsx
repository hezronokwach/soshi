'use client';

import { User } from 'lucide-react';

export default function ConversationList({ 
  conversations, 
  selectedConversation, 
  onConversationSelect, 
  loading 
}) {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const containerStyles = {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem'
  };

  const loadingStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: '#B8C1CF'
  };

  const emptyStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: '#B8C1CF',
    textAlign: 'center'
  };

  const conversationItemStyles = (isSelected, hasUnread) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isSelected ? 'rgba(58, 134, 255, 0.1)' : 'transparent',
    border: isSelected ? '1px solid rgba(58, 134, 255, 0.3)' : hasUnread ? '1px solid rgba(255, 0, 110, 0.2)' : '1px solid transparent',
    marginBottom: '0.25rem',
    position: 'relative'
  });

  const avatarStyles = {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    backgroundColor: '#3A86FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: '600',
    flexShrink: 0
  };

  const avatarImageStyles = {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    objectFit: 'cover'
  };

  const conversationInfoStyles = {
    flex: 1,
    minWidth: 0
  };

  const nameStyles = (hasUnread) => ({
    fontSize: '1rem',
    fontWeight: hasUnread ? '600' : '500',
    color: '#FFFFFF',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  });

  const messagePreviewStyles = (hasUnread) => ({
    fontSize: '0.875rem',
    color: hasUnread ? '#B8C1CF' : '#6C7A89',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: hasUnread ? '500' : '400'
  });

  const timestampStyles = {
    fontSize: '0.75rem',
    color: '#6C7A89',
    marginTop: '0.125rem'
  };

  const unreadBadgeStyles = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: '#FF006E',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderRadius: '50%',
    minWidth: '1.25rem',
    height: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 0.25rem'
  };

  const onlineIndicatorStyles = {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
    backgroundColor: '#06D6A0',
    border: '2px solid #1A2333',
    position: 'absolute',
    bottom: '0',
    right: '0'
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={loadingStyles}>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid #2A3343',
            borderTop: '2px solid #3A86FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ marginLeft: '0.5rem' }}>Loading conversations...</span>
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div style={containerStyles}>
        <div style={emptyStyles}>
          <User style={{ width: '2rem', height: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
          <p style={{ fontSize: '0.875rem' }}>No conversations yet</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
            Start a new chat to begin messaging
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return 'No recent messages';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div style={containerStyles}>
      {conversations.map((conversationInfo, index) => {
        // Handle both old and new data structures
        const conversation = conversationInfo.user || conversationInfo;
        const unreadCount = conversationInfo.unread_count || 0;
        const lastMessage = conversationInfo.last_message || '';
        const lastMessageTime = conversationInfo.last_message_time;
        const isOnline = conversationInfo.is_online || false;
        const hasUnread = unreadCount > 0;

        const isSelected = selectedConversation?.id === conversation.id;

        // Create a unique key combining conversation ID and index to avoid duplicates
        const uniqueKey = `conversation-${conversation.id}-${index}`;

        return (
          <div
            key={uniqueKey}
            style={conversationItemStyles(isSelected, hasUnread)}
            onClick={() => onConversationSelect(conversation)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.target.style.backgroundColor = 'rgba(184, 193, 207, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
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
              {/* Online indicator */}
              {isOnline && <div style={onlineIndicatorStyles}></div>}
            </div>

            <div style={conversationInfoStyles}>
              <div style={nameStyles(hasUnread)}>
                {conversation.first_name} {conversation.last_name}
              </div>
              <div style={messagePreviewStyles(hasUnread)}>
                {truncateMessage(lastMessage)}
              </div>
              {lastMessageTime && (
                <div style={timestampStyles}>
                  {formatTime(lastMessageTime)}
                </div>
              )}
            </div>

            {/* Unread badge */}
            {hasUnread && (
              <div style={unreadBadgeStyles}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
