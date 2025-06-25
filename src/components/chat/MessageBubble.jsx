'use client';

import { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, isOwn, showAvatar, showTimestamp }) {
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

  // Get sender info from message
  const sender = message.sender || {};
  const senderName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim();

  const containerStyles = {
    display: 'flex',
    flexDirection: isOwn ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    gap: '0.75rem',
    marginBottom: showTimestamp ? '1rem' : '0.25rem',
    padding: '0 1rem'
  };

  const avatarStyles = {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: '#3A86FF', // Primary color from style guide
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: '600',
    flexShrink: 0,
    visibility: showAvatar ? 'visible' : 'hidden',
    border: '2px solid #2A3343' // Border color from style guide
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
      ? '1.25rem 1.25rem 0.25rem 1.25rem'
      : '1.25rem 1.25rem 1.25rem 0.25rem',
    backgroundColor: isOwn ? '#3A86FF' : '#2A3343', // Style guide colors
    color: '#FFFFFF',
    fontSize: '0.95rem',
    lineHeight: '1.4',
    wordWrap: 'break-word',
    transition: 'all 0.2s ease',
    border: isOwn ? 'none' : '1px solid #374151',
    boxShadow: isOwn
      ? '0 2px 8px rgba(58, 134, 255, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)',
    position: 'relative'
  };

  const timeStyles = {
    fontSize: '0.7rem',
    color: isOwn ? 'rgba(255, 255, 255, 0.7)' : '#9CA3AF',
    marginTop: '0.25rem',
    textAlign: isOwn ? 'right' : 'left',
    fontWeight: '400'
  };

  const senderNameStyles = {
    fontSize: '0.75rem',
    color: '#3A86FF',
    fontWeight: '600',
    marginBottom: '0.25rem',
    display: isOwn ? 'none' : 'block'
  };

  const statusStyles = {
    fontSize: '0.7rem',
    color: '#6C7A89',
    marginTop: '0.25rem',
    textAlign: 'right',
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
        {showAvatar && sender?.avatar ? (
          <img
            src={sender.avatar}
            alt={senderName}
            style={avatarImageStyles}
          />
        ) : showAvatar ? (
          getInitials(sender?.first_name, sender?.last_name)
        ) : null}
      </div>

      {/* Message Content */}
      <div style={messageContainerStyles}>
        {/* Sender name for group messages (not own messages) */}
        {!isOwn && showAvatar && (
          <div style={senderNameStyles}>
            {senderName || 'Unknown User'}
          </div>
        )}

        <div style={bubbleStyles}>
          {message.content}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div style={timeStyles}>
            {formatTime(message.created_at)}
          </div>
        )}

        {/* Message Status (for own messages) */}
        {isOwn && messageStatus && showTimestamp && (
          <div style={{...statusStyles, color: messageStatus.color}}>
            {messageStatus.icon}
            <span>{messageStatus.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
