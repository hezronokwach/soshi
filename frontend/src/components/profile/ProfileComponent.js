'use client';

import { useState, useEffect } from 'react';
import ProfileDisplay from './ProfileDisplay';
import ProfileEditForm from './ProfileEditForm';
import { users } from '../../lib/api';
import { User, Settings, Shield } from 'lucide-react';

export default function ProfileComponent({ userId = null, isOwnProfile = false }) {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId, isOwnProfile]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isOwnProfile) {
        const [userResponse, profileResponse] = await Promise.all([
          users.getCurrentUser(),
          users.getProfile()
        ]);
        setUser(userResponse);
        setProfileData(profileResponse);
      } else if (userId) {
        const userResponse = await users.getProfile(userId);
        setUser(userResponse);
        setProfileData(userResponse);
      } else {
        throw new Error('No user ID provided for public profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (formData) => {
    try {
      setSaving(true);
      setError(null);
      
      const savedProfile = await users.updateProfile(formData);
      setProfileData(savedProfile);
      setIsEditing(false);
      
      // Refresh the profile data to ensure consistency
      await fetchUserProfile();
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError(error.message || 'Failed to save profile');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1624] flex items-center justify-center">
        <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg p-8 shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A86FF] mx-auto mb-4"></div>
          <p className="text-[#B8C1CF] font-inter">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1624] flex items-center justify-center">
        <div className="bg-[#1A2333] border border-[#EF476F] rounded-lg p-8 shadow-xl text-center max-w-md">
          <Shield size={48} className="text-[#EF476F] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#FFFFFF] mb-2 font-outfit">Profile Error</h2>
          <p className="text-[#B8C1CF] mb-4 font-inter">{error}</p>
          <button
            onClick={fetchUserProfile}
            className="bg-gradient-to-r from-[#3A86FF] to-[#8338EC] hover:shadow-[0_0_15px_rgba(58,134,255,0.5)] 
                     text-white px-6 py-3 rounded-lg transition-all duration-250 hover:scale-105 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1624] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User size={24} className="text-[#3A86FF]" />
            <h1 className="text-3xl font-bold text-[#FFFFFF] font-outfit">
              {isOwnProfile ? 'My Profile' : `${user?.first_name || 'User'}'s Profile`}
            </h1>
          </div>
          <p className="text-[#B8C1CF] font-inter">
            {isOwnProfile 
              ? 'Manage your profile information and privacy settings'
              : 'View profile information and connect with this user'
            }
          </p>
        </div>

        {/* Profile Content */}
        {isEditing ? (
          <ProfileEditForm
            user={profileData || user}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
            loading={saving}
          />
        ) : (
          <ProfileDisplay
            user={user}
            profileData={profileData}
            isOwnProfile={isOwnProfile}
            onEditClick={isOwnProfile ? handleEditClick : null}
          />
        )}

        {/* Error display */}
        {error && !loading && (
          <div className="mt-6 bg-[#1A2333] border border-[#EF476F] rounded-lg p-4">
            <p className="text-[#EF476F] font-inter">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
