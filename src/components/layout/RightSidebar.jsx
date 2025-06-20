"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Users, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { groups } from "@/lib/api";

export default function RightSidebar() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membershipStates, setMembershipStates] = useState({});

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
        fetchGroupsData() // Single function for both user and suggested groups
      ]);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch online users - you'll need to implement this API endpoint
  const fetchOnlineUsers = async () => {
    try {
      // Replace with your actual API call
      // const response = await api.getOnlineUsers();
      // setOnlineUsers(response);

      // For now, keeping a smaller mock dataset until you implement the API
      // Limit to 4 items for better presentation
      setOnlineUsers([
        { id: 1, name: "Alex Johnson", username: "alexj", status: "online" },
        { id: 2, name: "Samantha Lee", username: "samlee", status: "online" },
        { id: 3, name: "Marcus Chen", username: "mchen", status: "online" },
        { id: 4, name: "Jessica Wong", username: "jwong", status: "online" },
      ].slice(0, 4));
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  // Fetch suggested users - you'll need to implement this API endpoint
  const fetchSuggestedUsers = async () => {
    try {
      // Replace with your actual API call
      // const response = await api.getSuggestedUsers();
      // setSuggestedUsers(response);

      // For now, keeping a smaller mock dataset until you implement the API
      // Limit to 4 items for better presentation
      setSuggestedUsers([
        { id: 11, name: "John Smith", username: "jsmith", mutualFriends: 3 },
        { id: 12, name: "Olivia Parker", username: "oparker", mutualFriends: 2 },
        { id: 13, name: "Taylor Swift", username: "tswift", mutualFriends: 5 },
        { id: 14, name: "Emily Davis", username: "edavis", mutualFriends: 1 },
      ].slice(0, 4));
    } catch (error) {
      console.error('Error fetching suggested users:', error);
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

  // Handle follow user action
  const handleFollowUser = async (userId) => {
    try {
      // Implement follow user API call here
      // await api.followUser(userId);
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

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <div style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>Suggested Users</h3>
            <Link href="/discover/people" style={seeAllLinkStyles}>
              See All
            </Link>
          </div>

          <div>
            {suggestedUsers.map(user => (
              <div key={user.id} style={{ ...userItemStyles, backgroundColor: '#0F1624', padding: '0.75rem' }}>
                <div style={userAvatarStyles}>
                  <User style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div style={userInfoStyles}>
                  <p style={userNameStyles}>{user.name}</p>
                  <p style={userMetaStyles}>{user.mutualFriends} mutual connections</p>
                </div>
                <button style={followButtonStyles} onClick={() => handleFollowUser(user.id)}>
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
