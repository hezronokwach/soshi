'use client';

import { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';

export default function MessageInput({ onSendMessage, onTypingChange, disabled, placeholder = "Type a message..." }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');

      // Stop typing indicator
      if (isTyping && onTypingChange) {
        setIsTyping(false);
        onTypingChange(false);
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

    // Handle typing indicator
    if (onTypingChange) {
      if (newMessage.trim() && !isTyping) {
        setIsTyping(true);
        onTypingChange(true);
      } else if (!newMessage.trim() && isTyping) {
        setIsTyping(false);
        onTypingChange(false);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      if (newMessage.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingChange(false);
        }, 2000);
      }
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newMessage);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const commonEmojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😮', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];

  const containerStyles = {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #2A3343',
    backgroundColor: '#1A2333'
  };

  const formStyles = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
    position: 'relative'
  };

  const inputContainerStyles = {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F1624',
    borderRadius: '1.5rem',
    border: '1px solid #2A3343',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '0.75rem 1rem',
    transition: 'border-color 0.2s'
  };

  const textareaStyles = {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    lineHeight: '1.4',
    resize: 'none',
    minHeight: '1.4em',
    maxHeight: '120px',
    fontFamily: 'inherit',
    '::placeholder': {
      color: '#6C7A89'
    }
  };

  const emojiButtonStyles = {
    color: '#B8C1CF',
    padding: '0.25rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
    marginLeft: '0.5rem'
  };

  const sendButtonStyles = {
    backgroundColor: disabled ? '#2A3343' : '#3A86FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '50%',
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
    flexShrink: 0
  };

  const emojiPickerStyles = {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: '0.5rem',
    backgroundColor: '#1A2333',
    border: '1px solid #2A3343',
    borderRadius: '0.75rem',
    padding: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '0.5rem',
    maxWidth: '280px'
  };

  const emojiItemStyles = {
    fontSize: '1.25rem',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textAlign: 'center'
  };

  return (
    <div style={containerStyles}>
      <form onSubmit={handleSubmit} style={formStyles}>
        <div 
          style={{
            ...inputContainerStyles,
            borderColor: message.trim() ? '#3A86FF' : '#2A3343'
          }}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            style={textareaStyles}
            rows={1}
          />
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={emojiButtonStyles}
            onMouseEnter={(e) => e.target.style.color = '#3A86FF'}
            onMouseLeave={(e) => e.target.style.color = '#B8C1CF'}
          >
            <Smile style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <button
          type="submit"
          disabled={disabled || !message.trim()}
          style={sendButtonStyles}
          onMouseEnter={(e) => {
            if (!disabled && message.trim()) {
              e.target.style.backgroundColor = '#2D6FD9';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && message.trim()) {
              e.target.style.backgroundColor = '#3A86FF';
            }
          }}
        >
          <Send style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div style={emojiPickerStyles}>
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  insertEmoji(emoji);
                  setShowEmojiPicker(false);
                }}
                style={emojiItemStyles}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(58, 134, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </form>

      <style jsx>{`
        textarea::placeholder {
          color: #6C7A89;
        }
      `}</style>
    </div>
  );
}
