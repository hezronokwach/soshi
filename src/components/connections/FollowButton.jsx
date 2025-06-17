'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserMinus, 
  Clock, 
  Check,
  X 
} from 'lucide-react';
import { users } from '@/lib/api';

export default function FollowButton({ 
  targetUserID, 
  onStatusChange = null,
  size = 'default' 
}) {
  const [followStatus, setFollowStatus] = useState('none'); // 'none', 'pending', 'accepted'
  const [loading, setLoading] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    fetchFollowStatus();
  }, [targetUserID]);

  const fetchFollowStatus = async () => {
    try {
      const data = await users.getFollowStatus(targetUserID);
      setFollowStatus(data.status);
      setIsSelf(data.is_self);
    } catch (error) {
      console.error('Failed to fetch follow status:', error);
    }
  };

  const handleFollow = async () => {
    try {
      setLoading(true);
      const result = await users.followUser(targetUserID);
      setFollowStatus(result.status);
      onStatusChange?.(result.status);
    } catch (error) {
      console.error('Failed to follow user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setLoading(true);
      const result = await users.unfollowUser(targetUserID);
      setFollowStatus(result.status);
      onStatusChange?.(result.status);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setLoading(true);
      const result = await users.cancelFollowRequest(targetUserID);
      setFollowStatus(result.status);
      onStatusChange?.(result.status);
    } catch (error) {
      console.error('Failed to cancel follow request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for self
  if (isSelf) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1 text-sm';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const baseClasses = `${getSizeClasses()} rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`;

  if (followStatus === 'none') {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`${baseClasses} bg-primary hover:bg-primary-hover text-white`}
      >
        <UserPlus size={16} />
        {loading ? 'Following...' : 'Follow'}
      </button>
    );
  }

  if (followStatus === 'pending') {
    return (
      <button
        onClick={handleCancelRequest}
        disabled={loading}
        className={`${baseClasses} bg-warning hover:bg-warning-dark text-white`}
      >
        <Clock size={16} />
        {loading ? 'Cancelling...' : 'Pending'}
      </button>
    );
  }

  if (followStatus === 'accepted') {
    return (
      <button
        onClick={handleUnfollow}
        disabled={loading}
        className={`${baseClasses} bg-surface hover:bg-border text-text-primary border border-border`}
      >
        <Check size={16} />
        {loading ? 'Unfollowing...' : 'Following'}
      </button>
    );
  }

  return null;
}
