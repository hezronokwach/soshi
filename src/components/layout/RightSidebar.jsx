"use client";

import Link from "next/link";
import { User, Users, Plus } from "lucide-react";

export default function RightSidebar() {
  // Mock data for online users
  const onlineUsers = [
    { id: 1, name: "Alex Johnson", username: "alexj", status: "online" },
    { id: 2, name: "Samantha Lee", username: "samlee", status: "online" },
    { id: 3, name: "Marcus Chen", username: "mchen", status: "online" },
    { id: 4, name: "Jessica Wong", username: "jwong", status: "online" },
    { id: 5, name: "David Kim", username: "dkim", status: "online" },
    { id: 6, name: "Emily Davis", username: "edavis", status: "online" },
    { id: 7, name: "Michael Brown", username: "mbrown", status: "online" },
    { id: 8, name: "Sarah Miller", username: "smiller", status: "online" },
  ];

  // Mock data for suggested users
  const suggestedUsers = [
    { id: 11, name: "Taylor Swift", username: "tswift", mutualFriends: 5 },
    { id: 12, name: "John Smith", username: "jsmith", mutualFriends: 3 },
    { id: 13, name: "Olivia Parker", username: "oparker", mutualFriends: 2 },
  ];

  // Mock data for user's groups
  const userGroups = [
    { id: 1, name: "Tech Enthusiasts", members: 1243, category: "Technology", unread: 5 },
    { id: 2, name: "Digital Artists", members: 856, category: "Art", unread: 0 },
    { id: 3, name: "Travel Adventures", members: 2105, category: "Travel", unread: 12 },
  ];

  // Mock data for suggested groups
  const suggestedGroups = [
    { id: 4, name: "Photography Club", members: 943, category: "Photography" },
    { id: 5, name: "Book Lovers", members: 1256, category: "Books" },
    { id: 6, name: "Fitness Motivation", members: 3105, category: "Health" },
  ];



  const sidebarStyles = {
    display: 'none',
    position: 'fixed',
    right: 0,
    top: '64px',
    bottom: 0,
    width: '320px',
    backgroundColor: '#1A2333',
    borderLeft: '1px solid #2A3343',
    overflowY: 'auto',
    zIndex: 20
  };

  const containerStyles = {
    padding: '1.5rem 1rem'
  };

  const sectionStyles = {
    marginBottom: '2rem'
  };

  const sectionHeaderStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem'
  };

  const sectionTitleStyles = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#FFFFFF'
  };

  const seeAllLinkStyles = {
    fontSize: '0.75rem',
    color: '#3A86FF',
    textDecoration: 'none'
  };

  const userListStyles = {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '0.5rem',
    backgroundColor: '#0F1624',
    borderRadius: '0.75rem',
    marginBottom: '1rem',
    scrollbarWidth: 'thin',
    scrollbarColor: '#2A3343 #0F1624'
  };

  const userItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    marginBottom: '0.5rem'
  };

  const userAvatarStyles = {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '9999px',
    backgroundColor: '#2A3343',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#B8C1CF'
  };

  const userInfoStyles = {
    flex: 1
  };

  const userNameStyles = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#FFFFFF'
  };

  const userMetaStyles = {
    fontSize: '0.75rem',
    color: '#B8C1CF'
  };

  const onlineIndicatorStyles = {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '9999px',
    backgroundColor: '#06D6A0',
    marginLeft: 'auto'
  };

  const followButtonStyles = {
    width: '2rem',
    height: '2rem',
    borderRadius: '9999px',
    backgroundColor: '#3A86FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    border: 'none',
    cursor: 'pointer'
  };

  const groupItemStyles = {
    padding: '0.75rem',
    backgroundColor: '#0F1624',
    borderRadius: '0.75rem',
    marginBottom: '0.75rem'
  };

  const groupHeaderStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  };

  const groupAvatarStyles = {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '9999px',
    backgroundColor: '#8338EC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  };

  const groupInfoStyles = {
    flex: 1
  };

  const groupNameStyles = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#FFFFFF'
  };

  const groupMetaStyles = {
    fontSize: '0.75rem',
    color: '#B8C1CF'
  };

  const unreadBadgeStyles = {
    minWidth: '1.5rem',
    height: '1.5rem',
    borderRadius: '9999px',
    backgroundColor: '#FF006E',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 0.375rem'
  };

  const joinButtonStyles = {
    width: '100%',
    padding: '0.375rem 0',
    backgroundColor: '#2A3343',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };



  // Media query styles
  if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
    sidebarStyles.display = 'block';
  }

  return (
    <aside style={sidebarStyles}>
      <div style={containerStyles}>
        {/* Online Users */}
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>Online Users ({onlineUsers.length})</h3>
            <Link href="/friends" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div style={userListStyles}>
            {onlineUsers.map(user => (
              <div key={user.id} style={userItemStyles}>
                <div style={userAvatarStyles}>
                  <User style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div style={userInfoStyles}>
                  <p style={userNameStyles}>{user.name}</p>
                  <p style={userMetaStyles}>@{user.username}</p>
                </div>
                <div style={onlineIndicatorStyles}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Groups */}
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>Your Groups</h3>
            <Link href="/groups" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div>
            {userGroups.map(group => (
              <div key={group.id} style={groupItemStyles}>
                <div style={groupHeaderStyles}>
                  <div style={groupAvatarStyles}>
                    <Users style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <div style={groupInfoStyles}>
                    <p style={groupNameStyles}>{group.name}</p>
                    <p style={groupMetaStyles}>{group.category} • {group.members.toLocaleString()} members</p>
                  </div>
                  {group.unread > 0 && (
                    <div style={unreadBadgeStyles}>
                      {group.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Users */}
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>Suggested Users</h3>
            <Link href="/discover/people" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div>
            {suggestedUsers.map(user => (
              <div key={user.id} style={{...userItemStyles, backgroundColor: '#0F1624', padding: '0.75rem'}}>
                <div style={userAvatarStyles}>
                  <User style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div style={userInfoStyles}>
                  <p style={userNameStyles}>{user.name}</p>
                  <p style={userMetaStyles}>{user.mutualFriends} mutual connections</p>
                </div>
                <button style={followButtonStyles}>
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Groups */}
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>Suggested Groups</h3>
            <Link href="/discover/groups" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div>
            {suggestedGroups.map(group => (
              <div key={group.id} style={groupItemStyles}>
                <div style={groupHeaderStyles}>
                  <div style={groupAvatarStyles}>
                    <Users style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <div style={groupInfoStyles}>
                    <p style={groupNameStyles}>{group.name}</p>
                    <p style={groupMetaStyles}>{group.category} • {group.members.toLocaleString()} members</p>
                  </div>
                </div>
                <button style={joinButtonStyles}>
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </div>


      </div>
    </aside>
  );
}
