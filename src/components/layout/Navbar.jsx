"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, Bell, MessageSquare, User, LogOut } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Placeholder for authentication state
  const isAuthenticated = false;

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

  const searchContainerStyles = {
    display: 'none',
    position: 'relative',
    maxWidth: '28rem',
    width: '100%',
    margin: '0 1rem'
  };

  const searchIconStyles = {
    position: 'absolute',
    top: '50%',
    left: '0.75rem',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#B8C1CF'
  };

  const searchInputStyles = {
    width: '100%',
    backgroundColor: '#1A2333',
    color: '#FFFFFF',
    borderRadius: '9999px',
    padding: '0.5rem 1rem 0.5rem 2.5rem',
    outline: 'none'
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
    searchContainerStyles.display = 'flex';
    desktopNavStyles.display = 'flex';
    mobileMenuButtonStyles.display = 'none';
  }

  return (
    <nav style={navbarStyles}>
      <div style={containerStyles}>
        {/* Logo */}
        <Link href="/" style={logoStyles}>
          <span style={logoTextStyles}>Soshi</span>
        </Link>

        {/* Search Bar - Desktop */}
        <div style={searchContainerStyles}>
          <div style={searchIconStyles}>
            <Search style={{ height: '1.25rem', width: '1.25rem' }} />
          </div>
          <input
            type="text"
            placeholder="Search..."
            style={searchInputStyles}
          />
        </div>

        {/* Desktop Navigation */}
        <div style={desktopNavStyles}>
          {isAuthenticated ? (
            <>
              {/* Notification Icon */}
              <button style={{ position: 'relative', color: '#B8C1CF' }}>
                <Bell style={{ height: '1.5rem', width: '1.5rem' }} />
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
                  3
                </span>
              </button>

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
              <div style={{ position: 'relative' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              </div>
            </>
          ) : (
            <>
              <Link href="/(auth)/login" style={loginLinkStyles}>
                Login
              </Link>
              <Link
                href="/(auth)/register"
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
          <div style={{ padding: '0.75rem 1rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '0.75rem',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <Search style={{ height: '1.25rem', width: '1.25rem', color: '#B8C1CF' }} />
              </div>
              <input
                type="text"
                placeholder="Search..."
                style={{
                  width: '100%',
                  backgroundColor: '#1A2333',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem 0.5rem 2.5rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link href="/" style={mobileMenuItemStyles}>
              Home
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
              <button style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                color: '#EF476F',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <LogOut style={{ height: '1rem', width: '1rem' }} />
                Logout
              </button>
            ) : (
              <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href="/(auth)/login" style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  color: '#FFFFFF',
                  border: '1px solid #3A86FF'
                }}>
                  Login
                </Link>
                <Link href="/(auth)/register" style={{
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
