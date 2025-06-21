'use client';

import { useState, useEffect } from 'react';
import { users, upload } from '@/lib/api';

export function useProfile(userId = null) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await users.getProfile(userId);
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      // Handle avatar upload if present
      let avatarUrl = profile?.avatar;
      if (profileData.avatar && profileData.avatar instanceof File) {
        try {
          const uploadResult = await upload.uploadFile(profileData.avatar);
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          // Continue with profile update even if avatar upload fails
        }
      }

      // Prepare profile data
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        nickname: profileData.nickname || null,
        about_me: profileData.about_me || null,
        date_of_birth: profileData.date_of_birth,
        avatar: avatarUrl
      };

      // Update basic profile info
      const updatedProfile = await users.updateProfile(updateData);
      
      // Update privacy setting separately if it changed
      if (profileData.is_public !== profile?.is_public) {
        await users.updatePrivacy(profileData.is_public);
      }

      // Refresh profile data
      await fetchProfile();
      
      return updatedProfile;
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update privacy setting only
  const updatePrivacy = async (isPublic) => {
    try {
      setLoading(true);
      setError(null);
      await users.updatePrivacy(isPublic);
      
      // Update local state
      setProfile(prev => prev ? { ...prev, is_public: isPublic } : null);
    } catch (err) {
      setError(err.message || 'Failed to update privacy setting');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh profile data
  const refreshProfile = () => {
    fetchProfile();
  };

  // Load profile on mount or when userId changes
  useEffect(() => {
    fetchProfile();
  }, [userId]); // fetchProfile is stable and doesn't need to be in deps

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePrivacy,
    refreshProfile,
    refetch: fetchProfile
  };
}

export default useProfile;
