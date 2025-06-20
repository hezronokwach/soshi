"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Users, Plus } from "lucide-react";
import { users } from "@/lib/api";
import FollowButton from "@/components/connections/FollowButton";

export default function RightSidebar() {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching suggested users...');
      const data = await users.getSuggestedUsers();
      console.log('📊 Suggested users data:', data);
      setSuggestedUsers(data || []);
    } catch (error) {
      console.error('❌ Failed to fetch suggested users:', error);
      setSuggestedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowStatusChange = (userID, status) => {
    // Keep all users in the list but the follow button will update its state automatically
    // No need to remove users from the suggested list anymore
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

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

        {/* All Users */}
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>All Users</h3>
            <Link href="/discover/people" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div>
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{fontSize: '0.75rem', color: '#B8C1CF', marginBottom: '0.5rem'}}>
              </div>
            )}
            
            {loading ? (
              // Loading skeleton
              [...Array(3)].map((_, i) => (
                <div key={i} style={{...userItemStyles, backgroundColor: '#0F1624', padding: '0.75rem'}}>
                  <div style={{...userAvatarStyles, backgroundColor: '#2A3343'}}></div>
                  <div style={userInfoStyles}>
                    <div style={{height: '1rem', backgroundColor: '#2A3343', borderRadius: '0.25rem', marginBottom: '0.5rem'}}></div>
                    <div style={{height: '0.75rem', backgroundColor: '#2A3343', borderRadius: '0.25rem', width: '70%'}}></div>
                  </div>
                  <div style={{...followButtonStyles, backgroundColor: '#2A3343'}}></div>
                </div>
              ))
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map(user => (
                <div key={user.id} style={{...userItemStyles, backgroundColor: '#0F1624', padding: '0.75rem'}}>
                  <Link href={`/profile/${user.id}`} style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, textDecoration: 'none'}}>
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={`${user.first_name} ${user.last_name}`}
                        style={{...userAvatarStyles, objectFit: 'cover'}}
                      />
                    ) : (
                      <div style={userAvatarStyles}>
                        {getInitials(user.first_name, user.last_name)}
                      </div>
                    )}
                    <div style={userInfoStyles}>
                      <p style={userNameStyles}>{user.first_name} {user.last_name}</p>
                      <p style={userMetaStyles}>
                        {user.nickname ? `@${user.nickname}` : 'New user'}
                      </p>
                    </div>
                  </Link>
                  <div style={{flexShrink: 0}}>
                    <FollowButton
                      targetUserID={user.id}
                      onStatusChange={(status) => handleFollowStatusChange(user.id, status)}
                      size="small"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{textAlign: 'center', padding: '2rem', color: '#B8C1CF'}}>
                <p style={{fontSize: '0.875rem'}}>No other users found</p>
              </div>
            )}
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
