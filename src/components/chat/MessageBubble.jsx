'use client';

import { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, isOwn, showAvatar, user }) {
  const [showTime, setShowTime] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: isOwn ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  };

  const avatarStyles = {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: isOwn ? '#8338EC' : '#3A86FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: '600',
    flexShrink: 0,
    visibility: showAvatar ? 'visible' : 'hidden'
  };

  const avatarImageStyles = {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    objectFit: 'cover'
  };

  const messageContainerStyles = {
    maxWidth: '70%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isOwn ? 'flex-end' : 'flex-start'
  };

  const bubbleStyles = {
    padding: '0.75rem 1rem',
    borderRadius: isOwn 
      ? '1.125rem 1.125rem 0.25rem 1.125rem'
      : '1.125rem 1.125rem 1.125rem 0.25rem',
    backgroundColor: isOwn ? '#3A86FF' : '#1A2333',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    lineHeight: '1.4',
    wordWrap: 'break-word',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: isOwn ? 'none' : '1px solid #2A3343',
    boxShadow: isOwn 
      ? '0 2px 8px rgba(58, 134, 255, 0.2)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  const timeStyles = {
    fontSize: '0.75rem',
    color: '#6C7A89',
    marginTop: '0.25rem',
    opacity: showTime ? 1 : 0,
    transition: 'opacity 0.2s ease',
    textAlign: isOwn ? 'right' : 'left'
  };

  const statusStyles = {
    fontSize: '0.75rem',
    color: '#6C7A89',
    marginTop: '0.25rem',
    textAlign: 'right',
    opacity: showTime ? 1 : 0,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.25rem'
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;

    // For now, we'll use simple logic based on message properties
    // In a real app, you'd have proper delivery/read status from the backend
    if (message.is_read) {
      return {
        icon: <CheckCheck style={{ width: '0.875rem', height: '0.875rem' }} />,
        text: 'Read',
        color: '#06D6A0'
      };
    } else if (message.id) {
      return {
        icon: <Check style={{ width: '0.875rem', height: '0.875rem' }} />,
        text: 'Delivered',
        color: '#6C7A89'
      };
    } else {
      return {
        icon: <Check style={{ width: '0.875rem', height: '0.875rem' }} />,
        text: 'Sent',
        color: '#6C7A89'
      };
    }
  };

  const messageStatus = getMessageStatus();

  return (
    <div style={containerStyles}>
      {/* Avatar */}
      <div style={avatarStyles}>
        {showAvatar && user?.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.first_name} ${user.last_name}`}
            style={avatarImageStyles}
          />
        ) : showAvatar ? (
          getInitials(user?.first_name, user?.last_name)
        ) : null}
      </div>

      {/* Message Content */}
      <div style={messageContainerStyles}>
        <div
          style={bubbleStyles}
          onClick={() => setShowTime(!showTime)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = isOwn 
              ? '0 4px 12px rgba(58, 134, 255, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = isOwn 
              ? '0 2px 8px rgba(58, 134, 255, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
        >
          {message.content}
        </div>
        
        {/* Timestamp */}
        <div style={timeStyles}>
          {formatTime(message.created_at)}
        </div>

        {/* Message Status (for own messages) */}
        {isOwn && messageStatus && (
          <div style={{...statusStyles, color: messageStatus.color}}>
            {messageStatus.icon}
            <span>{messageStatus.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
