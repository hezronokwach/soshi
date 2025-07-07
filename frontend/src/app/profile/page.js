'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import ProfileDisplay from '../../components/profile/ProfileDisplay';
import ProfileEditForm from '../../components/profile/ProfileEditForm';
import ActivityPage from '../../components/activity/ActivityPage';
import ConnectionsPage from '../../components/connections/ConnectionsPage';
import { User, Activity, Users } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'activity', 'connections'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`/profile?${params.toString()}`);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async (profileData) => {
    try {
      setUpdateLoading(true);
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Error is already handled by the hook
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="w-full py-4 sm:py-6 lg:py-8">
        <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg p-8 shadow-xl">
          <div className="animate-pulse">
            <div className="h-32 bg-[#0F1624] rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-[#0F1624] rounded w-3/4"></div>
              <div className="h-4 bg-[#0F1624] rounded w-1/2"></div>
              <div className="h-4 bg-[#0F1624] rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-4 sm:py-6 lg:py-8">
        <div className="bg-[#1A2333] border border-[#EF476F] rounded-lg p-8 text-center shadow-xl">
          <div className="text-[#EF476F] mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#FFFFFF] mb-2 font-outfit">Error Loading Profile</h2>
          <p className="text-[#B8C1CF] mb-4 font-inter">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-[#3A86FF] to-[#8338EC] hover:shadow-[0_0_15px_rgba(58,134,255,0.5)] text-white px-6 py-3 rounded-lg transition-all duration-250 hover:scale-105 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8">
      <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg p-6 shadow-xl">
        <div className="flex gap-3 overflow-x-auto">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-250 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#3A86FF] to-[#8338EC] text-white shadow-[0_0_15px_rgba(58,134,255,0.5)] hover:scale-105'
                : 'bg-[#0F1624] text-[#B8C1CF] hover:bg-[#2A3343] hover:text-[#FFFFFF] border border-[#2A3343] hover:border-[#3A86FF] hover:scale-105'
            }`}
          >
            <User size={18} className={activeTab === 'profile' ? 'text-white' : 'text-[#3A86FF]'} />
            Profile
          </button>
          <button
            onClick={() => handleTabChange('activity')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-250 whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-gradient-to-r from-[#8338EC] to-[#FF006E] text-white shadow-[0_0_15px_rgba(131,56,236,0.5)] hover:scale-105'
                : 'bg-[#0F1624] text-[#B8C1CF] hover:bg-[#2A3343] hover:text-[#FFFFFF] border border-[#2A3343] hover:border-[#8338EC] hover:scale-105'
            }`}
          >
            <Activity size={18} className={activeTab === 'activity' ? 'text-white' : 'text-[#8338EC]'} />
            Activity
          </button>
          <button
            onClick={() => handleTabChange('connections')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-250 whitespace-nowrap ${
              activeTab === 'connections'
                ? 'bg-gradient-to-r from-[#FF006E] to-[#06D6A0] text-white shadow-[0_0_15px_rgba(255,0,110,0.5)] hover:scale-105'
                : 'bg-[#0F1624] text-[#B8C1CF] hover:bg-[#2A3343] hover:text-[#FFFFFF] border border-[#2A3343] hover:border-[#FF006E] hover:scale-105'
            }`}
          >
            <Users size={18} className={activeTab === 'connections' ? 'text-white' : 'text-[#FF006E]'} />
            Connections
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <>
          {isEditing ? (
            <ProfileEditForm
              user={profile || user}
              onSave={handleSave}
              onCancel={handleCancel}
              loading={updateLoading}
            />
          ) : (
            <ProfileDisplay
              user={user}
              profileData={profile}
              isOwnProfile={true}
              onEditClick={handleEditClick}
            />
          )}
        </>
      )}

      {activeTab === 'activity' && (
        <ActivityPage
          userID={null}
          isOwnProfile={true}
        />
      )}

      {activeTab === 'connections' && (
        <ConnectionsPage
          userID={null}
          isOwnProfile={true}
        />
      )}
      </div>
    </div>
  );
}
