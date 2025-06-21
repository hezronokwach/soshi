'use client';

import { useState, useEffect } from 'react';
import { activity as activityAPI } from '@/lib/api';

export function useActivity(userID = null) {
  const [activities, setActivities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user activities
  const fetchActivities = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await activityAPI.getUserActivities(userID, filters);
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user posts
  const fetchPosts = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await activityAPI.getUserPosts(userID, params);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity settings (only for own profile)
  const fetchSettings = async () => {
    if (userID) return; // Only fetch settings for own profile
    
    try {
      const data = await activityAPI.getActivitySettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load activity settings:', err);
    }
  };

  // Update activity settings
  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = await activityAPI.updateActivitySettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      throw new Error(err.message || 'Failed to update settings');
    }
  };

  // Hide an activity
  const hideActivity = async (activityID) => {
    try {
      await activityAPI.hideActivity(activityID);
      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityID 
            ? { ...activity, is_hidden: true }
            : activity
        )
      );
    } catch (err) {
      throw new Error(err.message || 'Failed to hide activity');
    }
  };

  // Unhide an activity
  const unhideActivity = async (activityID) => {
    try {
      await activityAPI.unhideActivity(activityID);
      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityID 
            ? { ...activity, is_hidden: false }
            : activity
        )
      );
    } catch (err) {
      throw new Error(err.message || 'Failed to unhide activity');
    }
  };

  // Load initial data
  useEffect(() => {
    fetchActivities();
    fetchSettings();
  }, [userID]);

  return {
    activities,
    posts,
    settings,
    loading,
    error,
    fetchActivities,
    fetchPosts,
    updateSettings,
    hideActivity,
    unhideActivity,
    refetch: () => {
      fetchActivities();
      fetchSettings();
    }
  };
}

export default useActivity;
