"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, Bell, MessageSquare, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { notifications } from "@/lib/api";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // State for user dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Ref for user dropdown
  const userMenuRef = useRef(null);

  // Fetch notification count
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCount();
      // Set up interval to fetch count every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotificationCount = async () => {
    try {
      const data = await notifications.getUnreadCount();
      setNotificationCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuRef]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect is handled in the logout function
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navbarStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    zIndex: 50,
    backgroundColor: 'rgba(26, 35, 51, 0.7)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const logoTextStyles = {
    fontSize: '1.5rem',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 'bold',
    backgroundImage: 'linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  };



  const desktopNavStyles = {
    display: 'none',
    alignItems: 'center',
    gap: '1.5rem'
  };

  const loginLinkStyles = {
    color: '#FFFFFF',
    padding: '0.5rem 1rem'
  };

  const registerLinkStyles = {
    backgroundColor: '#3A86FF',
    color: '#FFFFFF',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s'
  };

  const mobileMenuButtonStyles = {
    color: '#FFFFFF',
    display: 'block'
  };

  const mobileMenuStyles = {
    backgroundColor: 'rgba(26, 35, 51, 0.7)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const mobileMenuItemStyles = {
    display: 'block',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    color: '#FFFFFF'
  };

  // Media query styles
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    desktopNavStyles.display = 'flex';
    mobileMenuButtonStyles.display = 'none';
  }

  return (
    <nav style={navbarStyles}>
      <div style={containerStyles}>
        {/* Logo */}
        <Link href="/feed" style={logoStyles}>
          <span style={logoTextStyles}>Soshi</span>
        </Link>

        {/* Desktop Navigation */}
        <div style={desktopNavStyles}>
          {isAuthenticated ? (
            <>
              {/* Notification Icon */}
              <Link href="/notifications" style={{ position: 'relative', color: '#B8C1CF', textDecoration: 'none' }}>
                <Bell style={{ height: '1.5rem', width: '1.5rem' }} />
                {notificationCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.25rem',
                    right: '-0.25rem',
                    backgroundColor: '#FF006E',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    height: '1.25rem',
                    width: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Link>

              {/* Messages Icon */}
              <button style={{ position: 'relative', color: '#B8C1CF' }}>
                <MessageSquare style={{ height: '1.5rem', width: '1.5rem' }} />
                <span style={{
                  position: 'absolute',
                  top: '-0.25rem',
                  right: '-0.25rem',
                  backgroundColor: '#3A86FF',
                  color: 'white',
                  fontSize: '0.75rem',
                  borderRadius: '9999px',
                  height: '1.25rem',
                  width: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  5
                </span>
              </button>

              {/* User Profile */}
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div style={{
                    height: '2rem',
                    width: '2rem',
                    borderRadius: '9999px',
                    backgroundColor: '#3A86FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <User style={{ height: '1.25rem', width: '1.25rem' }} />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '12rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem',
                    zIndex: 50
                  }}>
                    <div style={{ padding: '0.25rem' }}>
                      <Link href="/profile" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        color: 'white',
                        transition: 'background-color 0.2s'
                      }}>
                        <User style={{ height: '1rem', width: '1rem' }} />
                        Profile
                      </Link>

                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          color: '#EF476F',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <LogOut style={{ height: '1rem', width: '1rem' }} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" style={loginLinkStyles}>
                Login
              </Link>
              <Link
                href="/register"
                style={registerLinkStyles}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          style={mobileMenuButtonStyles}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ?
            <X style={{ height: '1.5rem', width: '1.5rem' }} /> :
            <Menu style={{ height: '1.5rem', width: '1.5rem' }} />
          }
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={mobileMenuStyles}>

          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link href="/feed" style={mobileMenuItemStyles}>
              Feed
            </Link>
            <Link href="/posts" style={mobileMenuItemStyles}>
              Posts
            </Link>
            <Link href="/profile" style={mobileMenuItemStyles}>
              Profile
            </Link>
            <Link href="/groups" style={mobileMenuItemStyles}>
              Groups
            </Link>
            <Link href="/chat" style={mobileMenuItemStyles}>
              Chat
            </Link>
            <Link href="/notifications" style={mobileMenuItemStyles}>
              Notifications
            </Link>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  color: '#EF476F',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <LogOut style={{ height: '1rem', width: '1rem' }} />
                Logout
              </button>
            ) : (
              <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href="/login" style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  color: '#FFFFFF',
                  border: '1px solid #3A86FF'
                }}>
                  Login
                </Link>
                <Link href="/register" style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#3A86FF',
                  color: 'white'
                }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
