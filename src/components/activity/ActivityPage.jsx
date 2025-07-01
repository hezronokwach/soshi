'use client';

import { useState } from 'react';
import { 
  Activity as ActivityIcon, 
  FileText, 
  Settings,
  User as UserIcon
} from 'lucide-react';
import ActivityList from './ActivityList';
import ActivitySettings from './ActivitySettings';

export default function ActivityPage({ userID = null, isOwnProfile = false }) {
  const [activeTab, setActiveTab] = useState('timeline');

  const tabs = [
    {
      id: 'timeline',
      label: 'Activity Timeline',
      icon: <ActivityIcon size={16} />,
      description: 'All your activities in chronological order'
    },
    {
      id: 'posts',
      label: 'Posts Only',
      icon: <FileText size={16} />,
      description: 'Only posts you\'ve created'
    }
  ];

  // Add settings tab for own profile
  if (isOwnProfile) {
    tabs.push({
      id: 'settings',
      label: 'Privacy Settings',
      icon: <Settings size={16} />,
      description: 'Control what activities are visible to others'
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-[#3A86FF] to-[#8338EC] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(58,134,255,0.3)]">
            <ActivityIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#FFFFFF] font-outfit">
              {isOwnProfile ? 'Your Activity' : 'User Activity'}
            </h1>
            <p className="text-[#B8C1CF] font-inter">
              {isOwnProfile 
                ? 'Track and manage your activity across the platform'
                : 'View this user\'s public activities'
              }
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-250 font-medium ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#3A86FF] to-[#8338EC] text-white shadow-[0_0_15px_rgba(58,134,255,0.5)] hover:scale-105'
                  : 'bg-[#0F1624] text-[#B8C1CF] hover:bg-[#2A3343] hover:text-[#FFFFFF] border border-[#2A3343] hover:border-[#3A86FF] hover:scale-105'
              }`}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Description */}
        <div className="mt-3 p-3 bg-[#0F1624] rounded-lg border border-[#2A3343]">
          <p className="text-sm text-[#B8C1CF] font-inter">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'timeline' && (
          <ActivityList
            userID={userID}
            isOwnActivity={isOwnProfile}
            initialFilters={{}}
          />
        )}

        {activeTab === 'posts' && (
          <ActivityList
            userID={userID}
            isOwnActivity={isOwnProfile}
            initialFilters={{
              types: ['post_created']
            }}
          />
        )}

        {activeTab === 'settings' && isOwnProfile && (
          <ActivitySettings />
        )}
      </div>
    </div>
  );
}
