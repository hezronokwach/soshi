'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus,
  UserCheck
} from 'lucide-react';
import FollowersList from './FollowersList';
import { users } from '@/lib/api';

export default function ConnectionsPage({ userID = null, isOwnProfile = false }) {
  const [activeTab, setActiveTab] = useState('followers');
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, [userID]);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const data = await users.getFollowCounts(userID);
      setCounts(data);
    } catch (error) {
      console.error('Failed to fetch follow counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'followers',
      label: 'Followers',
      icon: <Users size={16} />,
      count: counts.followers,
      description: isOwnProfile ? 'People who follow you' : 'People following this user'
    },
    {
      id: 'following',
      label: 'Following',
      icon: <UserCheck size={16} />,
      count: counts.following,
      description: isOwnProfile ? 'People you follow' : 'People this user follows'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {isOwnProfile ? 'Your Connections' : 'Connections'}
            </h1>
            <p className="text-text-secondary">
              {isOwnProfile 
                ? 'Manage your followers and following'
                : 'View this user\'s connections'
              }
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-background hover:bg-border text-text-primary'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
              {!loading && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-border text-text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Description */}
        <div className="mt-3 p-3 bg-background rounded-lg">
          <p className="text-sm text-text-secondary">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'followers' && (
          <FollowersList
            userID={userID}
            isOwnProfile={isOwnProfile}
            title="Followers"
            type="followers"
          />
        )}

        {activeTab === 'following' && (
          <FollowersList
            userID={userID}
            isOwnProfile={isOwnProfile}
            title="Following"
            type="following"
          />
        )}
      </div>
    </div>
  );
}
