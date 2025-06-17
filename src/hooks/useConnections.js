'use client';

import { useState, useEffect } from 'react';
import { users } from '@/lib/api';

export function useConnections(userID = null) {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all connection data
  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const [followersData, followingData, countsData] = await Promise.all([
        users.getFollowers(userID),
        users.getFollowing(userID),
        users.getFollowCounts(userID)
      ]);

      setFollowers(followersData || []);
      setFollowing(followingData || []);
      setCounts(countsData || { followers: 0, following: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  // Follow a user
  const followUser = async (targetUserID) => {
    try {
      const result = await users.followUser(targetUserID);
      
      // If follow was successful, update counts
      if (result.status === 'accepted' || result.status === 'pending') {
        setCounts(prev => ({
          ...prev,
          following: prev.following + 1
        }));
      }
      
      return result;
    } catch (err) {
      throw new Error(err.message || 'Failed to follow user');
    }
  };

  // Unfollow a user
  const unfollowUser = async (targetUserID) => {
    try {
      const result = await users.unfollowUser(targetUserID);
      
      // Update local state - remove from following list if viewing own profile
      if (userID === null) { // Own profile
        setFollowing(prev => prev.filter(user => user.id !== targetUserID));
        setCounts(prev => ({
          ...prev,
          following: Math.max(0, prev.following - 1)
        }));
      }
      
      return result;
    } catch (err) {
      throw new Error(err.message || 'Failed to unfollow user');
    }
  };

  // Cancel follow request
  const cancelFollowRequest = async (targetUserID) => {
    try {
      const result = await users.cancelFollowRequest(targetUserID);
      
      // Update counts if needed
      setCounts(prev => ({
        ...prev,
        following: Math.max(0, prev.following - 1)
      }));
      
      return result;
    } catch (err) {
      throw new Error(err.message || 'Failed to cancel follow request');
    }
  };

  // Get follow status for a specific user
  const getFollowStatus = async (targetUserID) => {
    try {
      return await users.getFollowStatus(targetUserID);
    } catch (err) {
      throw new Error(err.message || 'Failed to get follow status');
    }
  };

  // Refresh all data
  const refresh = () => {
    fetchConnections();
  };

  // Load initial data
  useEffect(() => {
    fetchConnections();
  }, [userID]);

  return {
    followers,
    following,
    counts,
    loading,
    error,
    followUser,
    unfollowUser,
    cancelFollowRequest,
    getFollowStatus,
    refresh,
    refetch: fetchConnections
  };
}

export default useConnections;
