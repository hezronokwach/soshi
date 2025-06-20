'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { users } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import ActivityPage from '@/components/activity/ActivityPage';
import ConnectionsPage from '@/components/connections/ConnectionsPage';

export default function UserProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const userId = parseInt(params.id);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId && !isNaN(userId)) {
      fetchProfile();
    }
  }, [userId]);

  // Redirect to /profile if viewing own profile
  useEffect(() => {
    if (currentUser && isOwnProfile) {
      window.location.href = '/profile';
    }
  }, [currentUser, isOwnProfile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isNaN(userId)) {
        setError('Invalid user ID');
        return;
      }
      
      const profileData = await users.getProfile(userId);
      setProfile(profileData);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto max-w-4xl p-4" style={{ paddingTop: '5rem' }}>
          <div className="bg-surface border border-border rounded-lg p-8">
            <div className="animate-pulse">
              <div className="h-32 bg-background rounded-lg mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-background rounded w-3/4"></div>
                <div className="h-4 bg-background rounded w-1/2"></div>
                <div className="h-4 bg-background rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto max-w-4xl p-4" style={{ paddingTop: '5rem' }}>
          <div className="bg-surface border border-error rounded-lg p-8 text-center">
            <div className="text-error mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Error Loading Profile</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button 
              onClick={fetchProfile}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-4xl p-4 space-y-6" style={{ paddingTop: '5rem' }}>
        {/* Tab Navigation */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-primary text-white'
                  : 'bg-background hover:bg-border text-text-primary'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'bg-primary text-white'
                  : 'bg-background hover:bg-border text-text-primary'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'connections'
                  ? 'bg-primary text-white'
                  : 'bg-background hover:bg-border text-text-primary'
              }`}
            >
              Connections
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <ProfileDisplay
            user={profile}
            profileData={profile}
            isOwnProfile={isOwnProfile}
            onEditClick={null} // No edit for other users
          />
        )}

        {activeTab === 'activity' && (
          <ActivityPage
            userID={userId}
            isOwnProfile={isOwnProfile}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsPage
            userID={userId}
            isOwnProfile={isOwnProfile}
          />
        )}
      </div>
    </>
  );
}
