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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Group Header */}
      <Card variant="glassmorphism" className="p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-text-primary">{group.title}</h1>
              <span className="px-4 py-2 text-sm font-medium bg-secondary/20 text-secondary rounded-full border border-secondary/30 w-fit">
                {group.category || 'General'}
              </span>
            </div>
            <p className="text-text-secondary text-lg mb-4 leading-relaxed">{group.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                {group.creator?.avatar ? (
                  <img
                    src={group.creator.avatar}
                    alt={`${group.creator.first_name} ${group.creator.last_name}`}
                    className="w-6 h-6 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary-gradient rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {group.creator?.first_name?.[0]}{group.creator?.last_name?.[0]}
                    </span>
                  </div>
                )}
                <span>Created by {group.creator?.first_name || group.first_name} {group.creator?.last_name || group.last_name}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {acceptedMembers.length} members
              </span>
            </div>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            {!isCreator && (
              <Button
                variant="danger"
                size="lg"
                onClick={handleLeaveGroup}
                className="flex-1 lg:flex-none"
              >
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {['posts', 'members', 'events', 'chat'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'ghost'}
            size="lg"
            onClick={() => setActiveTab(tab)}
            className="capitalize relative"
          >
            {tab}
            {tab === 'members' && pendingMembers.length > 0 && (
              <span className="ml-2 bg-error text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
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