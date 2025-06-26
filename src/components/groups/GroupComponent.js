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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Groups</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreateGroup}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Title</label>
                <Input
                  value={newGroup.title}
                  onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                  placeholder="Enter group title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="w-full p-2 border rounded-md bg-grey"
                  required
                >
                  {GROUP_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Enter group description"
                  className="w-full p-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Group</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {groupsList.map((group) => {
          const joinButtonState = getJoinButtonState(group);

          return (
            <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                {/* Left side: Group info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Group avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {group.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Group details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{group.title}</h3>
                      {/* Category badge */}
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {group.category || 'General'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{group.description}</p>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {group.creator?.avatar || group.avatar ? (
                          <img
                            src={group.creator?.avatar || group.avatar}
                            alt={`${group.creator?.first_name || group.first_name} ${group.creator?.last_name || group.last_name}`}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {(group.creator?.first_name || group.first_name)?.[0]}{(group.creator?.last_name || group.last_name)?.[0]}
                            </span>
                          </div>
                        )}
                        <span>by {group.creator?.first_name || group.first_name} {group.creator?.last_name || group.last_name}</span>
                      </div>
                      <span>•</span>
                      <span>{group.member_count} members</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant={joinButtonState.variant}
                    disabled={joinButtonState.disabled}
                    onClick={() => handleButtonClick(group)}
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
        <div className="text-center py-12">
          <p className="text-gray-500">No groups found. Create the first one!</p>
        </div>
      )}
    </div>
  );
}
