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
  const [newGroup, setNewGroup] = useState({ title: '', description: '' });

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
      await groups.joinGroup(groupId);
      alert('Join request sent!');
      fetchGroups();
    } catch (error) {
      console.error('Error sending join request:', error);
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
        {groupsList.map((group) => (
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
                  <h3 className="font-semibold text-lg mb-1">{group.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{group.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {group.avatar ? (
                        <img
                          src={group.avatar}
                          alt={`${group.first_name} ${group.last_name}`}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                      )}
                      <span>by {group.first_name} {group.last_name}</span>
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
                  onClick={() => window.location.href = `/groups/${group.id}`}
                >
                  View Group
                </Button>
                {group.creator_id !== user?.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJoinRequest(group.id)}
                  >
                    Request to Join
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {groupsList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No groups found. Create the first one!</p>
        </div>
      )}
    </div>
  );
}
