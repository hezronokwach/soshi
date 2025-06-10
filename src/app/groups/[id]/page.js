// src/app/groups/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export default function GroupDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [newPost, setNewPost] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchGroup();
    }
  }, [params.id]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      } else if (response.status === 403) {
        alert('You need to be a member to view this group');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await fetch(`/api/groups/${params.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost })
      });

      if (response.ok) {
        setNewPost('');
        fetchGroup(); // Refresh to get new post
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.eventDate) return;

    try {
      const response = await fetch(`/api/groups/${params.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        setNewEvent({ title: '', description: '', eventDate: '' });
        fetchGroup(); // Refresh to get new event
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleEventResponse = async (eventId, response) => {
    try {
      await fetch(`/api/groups/events/${eventId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      fetchGroup(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error responding to event:', error);
    }
  };

  // Handle member requests
  const handleMemberRequest = async (userId, action) => {
    try {
      const response = await fetch(`/api/groups/${params.id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchGroup(); // Refresh to get updated member list
        alert(`Member ${action}ed successfully`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update member status');
      }
    } catch (error) {
      console.error('Error managing member:', error);
      alert('Failed to update member status');
    }
  };

  // Remove member
  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/groups/${params.id}/members/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchGroup(); // Refresh to get updated member list
        alert('Member removed successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      const response = await fetch(`/api/groups/${params.id}/join`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Successfully left the group');
        window.location.href = '/groups'; // Redirect to groups page
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading group...</div>;
  }

  if (!group) {
    return <div className="text-center p-8">Group not found or access denied</div>;
  }

  const isCreator = user && group.creator_id === user.id;
  const pendingMembers = group.members?.filter(member => member.status === 'pending') || [];
  const acceptedMembers = group.members?.filter(member => member.status === 'accepted') || [];

  return (
    <div className="container mx-auto p-4">
      {/* Group Header */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.title}</h1>
            <p className="text-gray-400 mb-4">{group.description}</p>
            <div className="text-sm text-gray-500">
              Created by {group.first_name} {group.last_name} • {acceptedMembers.length} members
            </div>
          </div>
          <div className="flex gap-2">
            {!isCreator && (
              <Button
                variant="outline"
                onClick={handleLeaveGroup}
                className="text-red-400 hover:text-red-300 border-red-400 hover:border-red-300"
              >
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6">
        {['posts', 'members', 'events'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab}
            {tab === 'members' && pendingMembers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingMembers.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Create Post Form */}
          <Card className="p-4">
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 border rounded-md mb-3 bg-background text-white"
                rows="3"
              />
              <Button type="submit" disabled={!newPost.trim()}>
                Post
              </Button>
            </form>
          </Card>

          {/* Posts List */}
          {group.posts?.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {post.avatar ? (
                  <img src={post.avatar} alt={post.first_name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                )}
                <div>
                  <p className="font-medium text-white">{post.first_name} {post.last_name}</p>
                  <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="mb-3 text-white">{post.content}</p>
              {post.image_path && (
                <img src={post.image_path} alt="Post image" className="max-w-full rounded-md" />
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Pending Requests (Only visible to group creator) */}
          {isCreator && pendingMembers.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-4 text-orange-400">
                Pending Join Requests ({pendingMembers.length})
              </h3>
              <div className="space-y-3">
                {pendingMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-orange-900/20 rounded-lg border border-orange-400/30">
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.first_name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                      )}
                      <div>
                        <p className="font-medium text-blue-400">{member.first_name} {member.last_name}</p>
                        <p className="text-sm text-blue-300">Wants to join this group</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMemberRequest(member.user_id, 'accept')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMemberRequest(member.user_id, 'decline')}
                        className="text-red-400 border-red-400 hover:bg-red-900/20"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Accepted Members */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4 text-white">
              Members ({acceptedMembers.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {acceptedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.first_name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                    )}
                    <div>
                      <p className="font-medium text-blue-400">{member.first_name} {member.last_name}</p>
                      {member.user_id === group.creator_id && (
                        <p className="text-xs text-blue-300 font-medium">Creator</p>
                      )}
                    </div>
                  </div>
                  {isCreator && member.user_id !== group.creator_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-400 border-red-400 hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Create Event Form */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-white">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
                className="bg-background text-white"
                required
              />
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
                className="w-full p-2 border rounded-md bg-background text-white"
                rows="2"
              />
              <Input
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                className="bg-background text-white"
                required
              />
              <Button type="submit">Create Event</Button>
            </form>
          </Card>

          {/* Events List */}
          {group.events?.map((event) => (
            <Card key={event.id} className="p-4">
              <h3 className="font-semibold text-lg mb-2 text-white">{event.title}</h3>
              <p className="text-gray-400 mb-2">{event.description}</p>
              <p className="text-sm text-gray-500 mb-3">
                {new Date(event.event_date).toLocaleString()}
              </p>
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  onClick={() => handleEventResponse(event.id, 'going')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Going ({event.going_count || 0})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEventResponse(event.id, 'not_going')}
                  className="text-red-400 border-red-400 hover:bg-red-900/20"
                >
                  Not Going ({event.not_going_count || 0})
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}