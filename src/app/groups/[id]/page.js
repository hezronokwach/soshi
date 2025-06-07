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
      await fetch(`/api/events/${eventId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      fetchGroup(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error responding to event:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading group...</div>;
  }

  if (!group) {
    return <div className="text-center p-8">Group not found or access denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Group Header */}
      <Card className="p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{group.title}</h1>
        <p className="text-gray-600 mb-4">{group.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Created by {group.first_name} {group.last_name} • {group.members?.length} members
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
                className="w-full p-3 border rounded-md mb-3"
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
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                )}
                <div>
                  <p className="font-medium">{post.first_name} {post.last_name}</p>
                  <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="mb-3">{post.content}</p>
              {post.image_path && (
                <img src={post.image_path} alt="Post image" className="max-w-full rounded-md" />
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {group.members?.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.first_name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                )}
                <div>
                  <p className="font-medium">{member.first_name} {member.last_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{member.status}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Create Event Form */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
                required
              />
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
                className="w-full p-2 border rounded-md"
                rows="2"
              />
              <Input
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                required
              />
              <Button type="submit">Create Event</Button>
            </form>
          </Card>

          {/* Events List */}
          {group.events?.map((event) => (
            <Card key={event.id} className="p-4">
              <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
              <p className="text-gray-600 mb-2">{event.description}</p>
              <p className="text-sm text-gray-500 mb-3">
                {new Date(event.event_date).toLocaleString()}
              </p>
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  onClick={() => handleEventResponse(event.id, 'going')}
                >
                  Going ({event.going_count})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEventResponse(event.id, 'not_going')}
                >
                  Not Going ({event.not_going_count})
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}