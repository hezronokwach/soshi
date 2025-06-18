// src/components/groups/GroupComponent.js
'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { groups } from '@/lib/api';

export default function GroupComponent() {
  const { user } = useAuth();
  const [groupsList, setGroupsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ title: '', description: '', category: 'Other' });
  const [requestStates, setRequestStates] = useState({}); // Track join request states

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await groups.getGroups();
      // Handle normalized response structure
      const groupsArray = Array.isArray(data) ? data : data.groups || [];
      setGroupsList(groupsArray);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groups.createGroup(newGroup);
      setNewGroup({ title: '', description: '' });
      setShowCreateForm(false);
      fetchGroups(); // Refresh groups
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      // Update UI immediately to show "Request Sent"
      setRequestStates(prev => ({ ...prev, [groupId]: 'sent' }));

      await groups.joinGroup(groupId);
      alert('Join request sent!');
      fetchGroups();
    } catch (error) {
      console.error('Error sending join request:', error);
      // Reset the state if request failed
      setRequestStates(prev => ({ ...prev, [groupId]: 'idle' }));
      alert('Failed to send join request. Please try again.');
    }
  };

  // Check if user is a member of the group
  const isMember = (group) => {
    // Check if user is the creator
    if (group.creator_id === user?.id) return true;

    // Check if user is in members list (if available)
    if (group.members && Array.isArray(group.members)) {
      return group.members.some(member =>
        member.user_id === user?.id && member.status === 'accepted'
      );
    }

    // Check if user_membership status is provided
    if (group.user_membership) {
      return group.user_membership === 'accepted';
    }

    return false;
  };

  // Check if user has pending request
  const hasPendingRequest = (group) => {
    if (group.members && Array.isArray(group.members)) {
      return group.members.some(member =>
        member.user_id === user?.id && member.status === 'pending'
      );
    }

    if (group.user_membership) {
      return group.user_membership === 'pending';
    }

    return false;
  };

  const getJoinButtonState = (group) => {
    const groupId = group.id;

    // Check local request state first
    if (requestStates[groupId] === 'sent') {
      return { text: 'Request Sent', disabled: true, variant: 'outline' };
    }

    // Check if user has pending request from backend
    if (hasPendingRequest(group)) {
      return { text: 'Request Sent', disabled: true, variant: 'outline' };
    }

    // Default join request button
    return { text: 'Request to Join', disabled: false, variant: 'outline' };
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
          const userIsMember = isMember(group);
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
                        {group.category || 'Other'}
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
                          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
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
                  {userIsMember ? (
                    // Show View Group button if user is a member
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/groups/${group.id}`}
                    >
                      View Group
                    </Button>
                  ) : (
                    // Show Join Request button if user is not a member
                    <Button
                      size="sm"
                      variant={joinButtonState.variant}
                      disabled={joinButtonState.disabled}
                      onClick={() => handleJoinRequest(group.id)}
                    >
                      {joinButtonState.text}
                    </Button>
                  )}
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
