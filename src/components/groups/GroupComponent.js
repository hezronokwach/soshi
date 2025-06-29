// src/components/groups/GroupComponent.js
'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { groups } from '@/lib/api';

// Predefined categories (you can also make this dynamic)
const GROUP_CATEGORIES = [
  'Technology', 'Art', 'Travel', 'Photography', 'Books', 'Music',
  'Sports', 'General', 'Food', 'Business', 'Education', 'Health', 'Other'
];

export default function GroupComponent() {
  const { user } = useAuth();
  const [groupsList, setGroupsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ title: '', description: '', category: 'General' });
  const [membershipStates, setMembershipStates] = useState({}); // Track membership states per group

  useEffect(() => {
    if (user?.id) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const data = await groups.getGroups();
      const groupsArray = Array.isArray(data) ? data : data.groups || [];
      setGroupsList(groupsArray);
      await fetchMembershipStates(groupsArray);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipStates = async (groupsArray) => {
    if (!user?.id) {
      console.warn('User not loaded or user.id missing');
      return;
    }

    const states = {};
    await Promise.all(
      groupsArray.map(async (group) => {
        try {
          const groupDetail = await groups.getGroup(group.id);
          if (groupDetail?.members && Array.isArray(groupDetail.members)) {
            const userMembership = groupDetail.members.find(
              member => parseInt(member.user_id) === parseInt(user.id)
            );
            states[group.id] = userMembership ? userMembership.status : 'none';
          } else {
            states[group.id] = 'none';
          }
        } catch (error) {
          console.error(`Error fetching membership for group ${group.id}:`, error);
          states[group.id] = 'none';
        }
      })
    );

    setMembershipStates(states);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const newGroupData = await groups.createGroup(newGroup);
      setNewGroup({ title: '', description: '', category: 'General' });
      setShowCreateForm(false);

      if (newGroupData) {
        setGroupsList(prev => [...prev, newGroupData]);
        // Creator is automatically added as 'accepted' member by backend
        setMembershipStates(prev => ({ ...prev, [newGroupData.id]: 'accepted' }));
      } else {
        fetchGroups(); // Refresh groups
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const getJoinButtonState = (group) => {
    const membershipStatus = membershipStates[group.id];

    switch (membershipStatus) {
      case 'accepted':
        return { text: 'View Group', disabled: false, variant: 'default', action: 'view' };
      case 'pending':
        return { text: 'Request Sent', disabled: true, variant: 'outline', action: 'none' };
      default:
        return { text: 'Request to Join', disabled: false, variant: 'outline', action: 'join' };
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      // Update UI immediately to show "Request Sent"
      setMembershipStates(prev => ({ ...prev, [groupId]: 'pending' }));

      await groups.joinGroup(groupId);
      await refreshGroupMembership(groupId);
    } catch (error) {
      console.error('Error sending join request:', error);
      // Reset the state if request failed
      setMembershipStates(prev => ({ ...prev, [groupId]: 'none' }));
      alert('Failed to send join request. Please try again.');
    }
  };

  const refreshGroupMembership = async (groupId) => {
    try {
      const groupDetail = await groups.getGroup(groupId);

      if (groupDetail?.members && Array.isArray(groupDetail.members)) {
        const userMembership = groupDetail.members.find(
          member => parseInt(member.user_id) === parseInt(user.id)
        );
        const status = userMembership ? userMembership.status : 'none';
        setMembershipStates(prev => ({ ...prev, [groupId]: status }));
      } else {
        setMembershipStates(prev => ({ ...prev, [groupId]: 'none' }));
      }
    } catch (error) {
      console.error(`Error refreshing membership for group ${groupId}:`, error);
    }
  };

  const handleButtonClick = (group) => {
    const buttonState = getJoinButtonState(group);

    if (buttonState.action === 'view') {
      window.location.href = `/groups/${group.id}`;
    } else if (buttonState.action === 'join') {
      handleJoinRequest(group.id);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading groups...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-text-primary mb-2">
              Groups
            </h1>
            <p className="text-lg text-text-secondary">
              Connect with communities that share your interests
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            {showCreateForm ? 'Cancel' : 'Create Group'}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card variant="glassmorphism" className="p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Create New Group</h2>
            <p className="text-text-secondary">Start a community around your interests</p>
          </div>
          <form onSubmit={handleCreateGroup}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-display font-semibold text-text-primary mb-2">Group Title</label>
                <Input
                  value={newGroup.title}
                  onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                  placeholder="Enter group title"
                  variant="filled"
                  size="lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-text-primary mb-2">Category</label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="w-full p-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-normal appearance-none pr-10 font-medium"
                  style={{
                    backgroundImage: "url(" + encodeURI("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B8C1CF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") + "" + ")",
                    backgroundPosition: "right 0.75rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.25em 1.25em"
                  }}
                  required
                >
                  {GROUP_CATEGORIES.map(category => (
                    <option key={category} value={category} style={{backgroundColor: '#1A2333', color: '#FFFFFF'}}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-text-primary mb-2">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Describe what your group is about..."
                  className="w-full p-3 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-normal resize-none"
                  rows="4"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" variant="primary" size="lg" className="flex-1">
                  Create Group
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  size="lg"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
        {groupsList.map((group) => {
          const joinButtonState = getJoinButtonState(group);

          return (
            <Card key={group.id} variant="glassmorphism" hover className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left side: Group info */}
                <div className="flex items-start space-x-4 flex-1">
                  {/* Group avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-gradient rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-display font-bold text-xl">
                        {group.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Group details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-display font-bold text-xl text-text-primary">{group.title}</h3>
                      {/* Category badge */}
                      <span className="px-3 py-1 text-xs font-medium bg-secondary/20 text-secondary rounded-full border border-secondary/30 w-fit">
                        {group.category || 'General'}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mb-3 line-clamp-2">{group.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        {group.creator?.avatar || group.avatar ? (
                          <img
                            src={group.creator?.avatar || group.avatar}
                            alt={`${group.creator?.first_name || group.first_name} ${group.creator?.last_name || group.last_name}`}
                            className="w-6 h-6 rounded-full border border-border"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-primary-gradient rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {(group.creator?.first_name || group.first_name)?.[0]}{(group.creator?.last_name || group.last_name)?.[0]}
                            </span>
                          </div>
                        )}
                        <span>by {group.creator?.first_name || group.first_name} {group.creator?.last_name || group.last_name}</span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {group.member_count} members
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Action buttons */}
                <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant={joinButtonState.variant}
                    disabled={joinButtonState.disabled}
                    onClick={() => handleButtonClick(group)}
                    className="flex-1 sm:flex-none"
                  >
                    {joinButtonState.text}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {groupsList.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface border border-border flex items-center justify-center">
            <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
            No groups yet
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Be the first to create a group and start building your community!
          </p>
        </div>
      )}
    </div>
  );
}
