// src/app/groups/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { groups } from '@/lib/api';
import GroupPosts from '@/components/groups/GroupPosts';
import GroupMembers from '@/components/groups/GroupMembers';
import GroupEvents from '@/components/groups/GroupEvents';
import GroupChatInterface from '@/components/chat/GroupChatInterface';

export default function GroupDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (params.id) {
      fetchGroup();
    }
  }, [params.id]);

  const fetchGroup = async () => {
    try {
      const data = await groups.getGroup(params.id);
      console.log('Raw group data from API:', data);

      // Get posts and events for the group
      const [postsData, eventsData] = await Promise.all([
        groups.getPosts(params.id).catch(() => ({ posts: [] })),
        groups.getEvents(params.id).catch(() => [])
      ]);

      // Ensure we have the basic group structure with defaults
      const groupData = {
        id: data.id,
        title: data.title || '',
        description: data.description || '',
        creator_id: data.creator_id,
        // Handle creator info - extract from nested creator object
        first_name: data.creator?.first_name || data.first_name || data.creator_first_name || '',
        last_name: data.creator?.last_name || data.last_name || data.creator_last_name || '',
        // Handle members array - ensure it exists
        members: Array.isArray(data.members) ? data.members : [],
        // Handle posts and events
        posts: postsData.posts || postsData || [],
        events: Array.isArray(eventsData) ? eventsData : eventsData.events || [],
        // Copy any other fields
        ...data
      };
      console.log('Group members:', groupData.members);
      groupData.members?.forEach((member, index) => {
        console.log(`Member ${index}:`, member);
      });

      console.log('Final group data:', groupData);
      setGroup(groupData);
    } catch (error) {
      console.error('Error fetching group:', error);
      if (error.message.includes('403') || error.message.includes('access')) {
        alert('You need to be a member to view this group');
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      await groups.leaveGroup(params.id);
      alert('Successfully left the group');
      window.location.href = '/groups'; // Redirect to groups page
    } catch (error) {
      console.error('Error leaving group:', error);
      alert(error.message || 'Failed to leave group');
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                {group.creator?.avatar ? (
                  <img
                    src={group.creator.avatar}
                    alt={`${group.creator.first_name} ${group.creator.last_name}`}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {group.creator?.first_name?.[0]}{group.creator?.last_name?.[0]}
                    </span>
                  </div>
                )}
                <span>Created by {group.creator?.first_name || group.first_name} {group.creator?.last_name || group.last_name}</span>
              </div>
              <span>•</span>
              <span>{acceptedMembers.length} members</span>
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
        {['posts', 'members', 'events', 'chat'].map((tab) => (
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
        <GroupPosts
          params={params}
          group={group}
          fetchGroup={fetchGroup}
        />
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <GroupMembers
          params={params}
          group={group}
          isCreator={isCreator}
          pendingMembers={pendingMembers}
          acceptedMembers={acceptedMembers}
          fetchGroup={fetchGroup}
        />
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <GroupEvents
          params={params}
          group={group}
          fetchGroup={fetchGroup}
        />
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div style={{ height: '600px' }}>
          <GroupChatInterface group={group} />
        </div>
      )}
    </div>
  );
}