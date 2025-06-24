"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Users, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { users, groups } from "@/lib/api";
import FollowButton from "@/components/connections/FollowButton";

export default function RightSidebar() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOnlineUsers(),
        fetchSuggestedUsers(),
        fetchGroupsData()
      ]);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch online users from WebSocket connections
  const fetchOnlineUsers = async () => {
    try {
      const response = await users.getOnlineUsers();
      setOnlineUsers(response || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
    }
  };

  // Fetch suggested users using the API
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
    }
  };

  // Fetch and categorize groups based on user membership
  const fetchGroupsData = async () => {
    try {
      const data = await groups.getGroups();
      const groupsArray = Array.isArray(data) ? data : data.groups || [];

      const userMemberGroups = [];
      const nonMemberGroups = [];

      // Process all groups in a single loop
      for (const group of groupsArray) {
        try {
          const groupDetail = await groups.getGroup(group.id);
          if (groupDetail?.members && Array.isArray(groupDetail.members)) {
            const userMembership = groupDetail.members.find(
              member => parseInt(member.user_id) === parseInt(user.id)
            );

            const groupData = {
              id: group.id,
              name: group.title,
              members: group.member_count || 0,
              category: group.category || 'General'
            };

            if (userMembership && userMembership.status === 'accepted') {
              // User is a member - add to user groups with unread count
              const unreadCount = 0; // Replace with actual unread count from the API
              userMemberGroups.push({
                ...groupData,
                unread: unreadCount
              });
            } else {
              // User is not a member or not accepted - add to suggested groups
              nonMemberGroups.push(groupData);
            }
          }
        } catch (error) {
          console.error(`Error fetching details for group ${group.id}:`, error);
        }
      }

      // Limit both lists to 4 items for better presentation
      setUserGroups(userMemberGroups.slice(0, 4));
      setSuggestedGroups(nonMemberGroups.slice(0, 4));

    } catch (error) {
      console.error('Error fetching groups data:', error);
    }
  };

  // Handle follow status change
  const handleFollowStatusChange = (userID, status) => {
    // Keep all users in the list but the follow button will update its state automatically
    // No need to remove users from the suggested list anymore
  };

  // Get user initials for avatar display
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Handle follow user action (for online users section)
  const handleFollowUser = async (userId) => {
    try {
      // This will be handled by the FollowButton component
      console.log('Following user:', userId);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  // Handle join group action
  const handleJoinGroup = async (groupId) => {
    try {
      await groups.joinGroup(groupId);
      // Refresh the groups data to update both lists
      fetchGroupsData();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to send join request. Please try again.');
    }
  };

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

  if (loading) {
    return (
      <aside style={sidebarStyles}>
        <div style={containerStyles}>
          <div style={{ color: '#FFFFFF', textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside style={sidebarStyles}>
      <div style={containerStyles}>
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div style={sectionStyles}>
            <div style={sectionHeaderStyles}>
              <h3 style={sectionTitleStyles}>Online Users ({onlineUsers.length})</h3>
              <Link href="/friends" style={seeAllLinkStyles}>
                See All
              </Link>
            </div>

            <div style={userListStyles}>
              {onlineUsers.map(onlineUser => (
                <Link key={onlineUser.id} href={`/profile/${onlineUser.id}`} style={{ textDecoration: 'none' }}>
                  <div style={userItemStyles}>
                    {onlineUser.avatar ? (
                      <img
                        src={onlineUser.avatar}
                        alt={`${onlineUser.first_name} ${onlineUser.last_name}`}
                        style={{...userAvatarStyles, objectFit: 'cover'}}
                      />
                    ) : (
                      <div style={userAvatarStyles}>
                        {getInitials(onlineUser.first_name, onlineUser.last_name)}
                      </div>
                    )}
                    <div style={userInfoStyles}>
                      <p style={userNameStyles}>{onlineUser.first_name} {onlineUser.last_name}</p>
                      <p style={userMetaStyles}>
                        {onlineUser.nickname ? `@${onlineUser.nickname}` : 'Online now'}
                      </p>
                    </div>
                    <div style={onlineIndicatorStyles}></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Your Groups */}
        {userGroups.length > 0 && (
          <div style={sectionStyles}>
            <div style={sectionHeaderStyles}>
              <h3 style={sectionTitleStyles}>Your Groups</h3>
              <Link href="/groups" style={seeAllLinkStyles}>
                See All
              </Link>
            </div>

            <div>
              {userGroups.map(group => (
                <Link key={group.id} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
                  <div style={groupItemStyles}>
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Users (Suggested Users) */}
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>All Users</h3>
            <Link href="/discover/people" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div>
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{fontSize: '0.75rem', color: '#B8C1CF', marginBottom: '0.5rem'}}>
                {/* Debug info can be added here if needed */}
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
        {suggestedGroups.length > 0 && (
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
                  <button style={joinButtonStyles} onClick={() => handleJoinGroup(group.id)}>
                    Join Group
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}