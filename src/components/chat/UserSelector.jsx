'use client';

import { useState, useEffect } from 'react';
import { users } from '@/lib/api';
import { X, Search, User } from 'lucide-react';

export default function UserSelector({ onUserSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [suggested, online] = await Promise.all([
        users.getSuggestedUsers(),
        users.getOnlineUsers()
      ]);
      setSuggestedUsers(suggested || []);
      setOnlineUsers(online || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setSuggestedUsers([]);
      setOnlineUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Defensive filter: Only show public users or those the current user follows (if such info is present)
  const privacyFilter = (user) => {
    if (user.is_public === undefined || user.is_public) return true;
    // If backend provides a 'follow_status' or similar, allow if 'accepted'
    if (user.follow_status && user.follow_status === 'accepted') return true;
    return false;
  };

  const filteredSuggestedUsers = suggestedUsers
    .filter(privacyFilter)
    .filter(user =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const filteredOnlineUsers = onlineUsers
    .filter(privacyFilter)
    .filter(user =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '1rem'
  };

  const modalStyles = {
    backgroundColor: '#1A2333',
    borderRadius: '1rem',
    border: '1px solid #2A3343',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  };

  const headerStyles = {
    padding: '1.5rem',
    borderBottom: '1px solid #2A3343',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const titleStyles = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: "'Outfit', sans-serif"
  };

  const closeButtonStyles = {
    color: '#B8C1CF',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const searchContainerStyles = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #2A3343'
  };

  const searchInputContainerStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const searchInputStyles = {
    width: '100%',
    backgroundColor: '#0F1624',
    border: '1px solid #2A3343',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const searchIconStyles = {
    position: 'absolute',
    left: '0.75rem',
    color: '#6C7A89',
    width: '1.25rem',
    height: '1.25rem'
  };

  const contentStyles = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.5rem'
  };

  const sectionStyles = {
    marginBottom: '1.5rem'
  };

  const sectionTitleStyles = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#B8C1CF',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const userListStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const userItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: '1px solid transparent'
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
    fontWeight: '600',
    flexShrink: 0
  };

  const avatarImageStyles = {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    objectFit: 'cover'
  };

  const userInfoStyles = {
    flex: 1,
    minWidth: 0
  };

  const nameStyles = {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: '0.125rem'
  };

  const usernameStyles = {
    fontSize: '0.875rem',
    color: '#B8C1CF'
  };

  const onlineIndicatorStyles = {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: '#06D6A0'
  };

  const emptyStyles = {
    textAlign: 'center',
    color: '#6C7A89',
    fontSize: '0.875rem',
    padding: '1rem'
  };

  const loadingStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: '#B8C1CF'
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <h2 style={titleStyles}>Start New Chat</h2>
          <button
            onClick={onClose}
            style={closeButtonStyles}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(184, 193, 207, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Search */}
        <div style={searchContainerStyles}>
          <div style={searchInputContainerStyles}>
            <Search style={searchIconStyles} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyles}
              onFocus={(e) => e.target.style.borderColor = '#3A86FF'}
              onBlur={(e) => e.target.style.borderColor = '#2A3343'}
            />
          </div>
        </div>

        {/* Content */}
        <div style={contentStyles}>
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
              <span style={{ marginLeft: '0.5rem' }}>Loading users...</span>
            </div>
          ) : (
            <>
              {/* Online Users */}
              {filteredOnlineUsers.length > 0 && (
                <div style={sectionStyles}>
                  <h3 style={sectionTitleStyles}>Online Now</h3>
                  <div style={userListStyles}>
                    {filteredOnlineUsers.map((user) => (
                      <div
                        key={user.id}
                        style={userItemStyles}
                        onClick={() => onUserSelect(user)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(58, 134, 255, 0.1)';
                          e.target.style.borderColor = 'rgba(58, 134, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = 'transparent';
                        }}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.first_name} ${user.last_name}`}
                            style={avatarImageStyles}
                          />
                        ) : (
                          <div style={avatarStyles}>
                            {getInitials(user.first_name, user.last_name)}
                          </div>
                        )}
                        
                        <div style={userInfoStyles}>
                          <div style={nameStyles}>
                            {user.first_name} {user.last_name}
                          </div>
                          <div style={usernameStyles}>
                            {user.nickname ? `@${user.nickname}` : 'Online'}
                          </div>
                        </div>
                        
                        <div style={onlineIndicatorStyles}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Users */}
              {filteredSuggestedUsers.length > 0 && (
                <div style={sectionStyles}>
                  <h3 style={sectionTitleStyles}>Suggested</h3>
                  <div style={userListStyles}>
                    {filteredSuggestedUsers.map((user) => (
                      <div
                        key={user.id}
                        style={userItemStyles}
                        onClick={() => onUserSelect(user)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(58, 134, 255, 0.1)';
                          e.target.style.borderColor = 'rgba(58, 134, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = 'transparent';
                        }}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.first_name} ${user.last_name}`}
                            style={avatarImageStyles}
                          />
                        ) : (
                          <div style={avatarStyles}>
                            {getInitials(user.first_name, user.last_name)}
                          </div>
                        )}
                        
                        <div style={userInfoStyles}>
                          <div style={nameStyles}>
                            {user.first_name} {user.last_name}
                          </div>
                          <div style={usernameStyles}>
                            {user.nickname ? `@${user.nickname}` : 'User'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredOnlineUsers.length === 0 && filteredSuggestedUsers.length === 0 && (
                <div style={emptyStyles}>
                  <User style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>
                    {searchTerm ? 'No users found matching your search.' : 'No users available to chat with.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
