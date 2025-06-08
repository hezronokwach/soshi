// export default function GroupComponent() {
//   return (
//     <div className="border p-4 rounded-lg shadow-sm">
//       <h2 className="text-lg font-semibold mb-2">Group Component</h2>
//       <p>This is a placeholder for the group component.</p>
//     </div>
//   );
// }
// src/components/groups/GroupComponent.js
'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export default function GroupComponent() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      });

      if (response.ok) {
        setNewGroup({ title: '', description: '' });
        setShowCreateForm(false);
        fetchGroups(); // Refresh groups
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Join request sent!');
        fetchGroups();
      }
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{group.title}</h3>
              <p className="text-gray-600 text-sm">{group.description}</p>

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

              <div className="flex gap-2">
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

      {groups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No groups found. Create the first one!</p>
        </div>
      )}
    </div>
  );
}
