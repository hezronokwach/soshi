"use client";

import Link from "next/link";
import {
  User,
  Users,
  Calendar,
  MessageSquare,
  Heart,
  MessageCircle,
  Bookmark,
  Settings
} from "lucide-react";

export default function LeftSidebar() {
  const sidebarStyles = {
    display: 'none',
    position: 'fixed',
    left: 0,
    top: '64px',
    bottom: 0,
    width: '300px',
    backgroundColor: '#1A2333',
    borderRight: '1px solid #2A3343',
    overflowY: 'auto',
    zIndex: 20
  };

  const containerStyles = {
    padding: '1.5rem 1rem'
  };

  const navStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const linkStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: '#FFFFFF',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    transition: 'background-color 0.2s'
  };

  const activeLinkStyles = {
    ...linkStyles,
    backgroundColor: 'rgba(58, 134, 255, 0.1)',
    color: '#3A86FF'
  };

  const iconStyles = {
    width: '1.25rem',
    height: '1.25rem'
  };

  const dividerStyles = {
    margin: '1.5rem 0',
    border: 'none',
    borderTop: '1px solid #2A3343'
  };

  const sectionTitleStyles = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#B8C1CF',
    marginBottom: '0.75rem',
    paddingLeft: '1rem'
  };



  // Media query styles
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    sidebarStyles.display = 'block';
  }

  return (
    <aside style={sidebarStyles}>
      <div style={containerStyles}>
        <nav style={navStyles}>
          {/* Main Navigation */}
          <Link
            href="/feed"
            style={activeLinkStyles}
          >
            <MessageCircle style={{...iconStyles, color: '#3A86FF'}} />
            <span>Posts</span>
          </Link>

          <Link
            href="/posts/liked"
            style={linkStyles}
          >
            <Heart style={{...iconStyles, color: '#EF476F'}} />
            <span>Liked Posts</span>
          </Link>

          <Link
            href="/posts/commented"
            style={linkStyles}
          >
            <MessageSquare style={{...iconStyles, color: '#118AB2'}} />
            <span>Commented Posts</span>
          </Link>

          <Link
            href="/posts/saved"
            style={linkStyles}
          >
            <Bookmark style={{...iconStyles, color: '#FFD166'}} />
            <span>Saved Posts</span>
          </Link>

          <hr style={dividerStyles} />

          <h3 style={sectionTitleStyles}>PROFILE</h3>

          <Link
            href="/profile"
            style={linkStyles}
          >
            <User style={{...iconStyles, color: '#8338EC'}} />
            <span>My Profile</span>
          </Link>

          <Link
            href="/profile/followers"
            style={linkStyles}
          >
            <Users style={{...iconStyles, color: '#06D6A0'}} />
            <span>Followers</span>
          </Link>

          <hr style={dividerStyles} />

          <h3 style={sectionTitleStyles}>DISCOVER</h3>

          <Link
            href="/groups"
            style={linkStyles}
          >
            <Users style={{...iconStyles, color: '#06D6A0'}} />
            <span>Groups</span>
          </Link>

          <Link
            href="/events"
            style={linkStyles}
          >
            <Calendar style={{...iconStyles, color: '#FFD166'}} />
            <span>Events</span>
          </Link>

          <Link
            href="/chat"
            style={linkStyles}
          >
            <MessageSquare style={{...iconStyles, color: '#118AB2'}} />
            <span>Messages</span>
          </Link>

          <hr style={dividerStyles} />

          <Link
            href="/settings"
            style={linkStyles}
          >
            <Settings style={{...iconStyles, color: '#B8C1CF'}} />
            <span>Settings</span>
          </Link>
        </nav>


      </div>
    </aside>
  );
}
