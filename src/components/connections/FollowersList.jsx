'use client';

import { useState, useEffect } from 'react';
import { users } from '@/lib/api';
import UserCard from './UserCard';
import { 
  Users, 
  Search,
  Filter
} from 'lucide-react';

export default function FollowersList({ 
  userID = null, 
  isOwnProfile = false,
  title = "Followers",
  type = "followers" // "followers" or "following"
}) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [userID, type]);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(usersList);
    } else {
      const filtered = usersList.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [usersList, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (type === 'followers') {
        data = await users.getFollowers(userID);
      } else {
        data = await users.getFollowing(userID);
      }
      
      setUsersList(data || []);
    } catch (err) {
      setError(err.message || `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowStatusChange = (targetUserID, newStatus) => {
    // If user unfollowed someone while viewing following list, remove them
    if (type === 'following' && newStatus === 'none' && isOwnProfile) {
      setUsersList(prev => prev.filter(user => user.id !== targetUserID));
    }
    // If someone unfollowed the profile owner while viewing followers, remove them
    if (type === 'followers' && newStatus === 'none') {
      // This would require additional logic to detect if the current user unfollowed the profile owner
      // For now, we'll just refresh the list
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-gradient rounded-full flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            <p className="text-text-secondary text-sm">Loading...</p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-4">
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-border rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border rounded w-3/4"></div>
                  <div className="h-3 bg-border rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-border rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="text-center">
          <div className="text-error mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Error Loading {title}</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button 
            onClick={fetchUsers}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-gradient rounded-full flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            <p className="text-text-secondary text-sm">
              {usersList.length} {usersList.length === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      {usersList.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-disabled" />
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg 
                       text-text-primary placeholder-text-disabled focus:border-primary 
                       focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              showFollowButton={!isOwnProfile || type === 'following'}
              onFollowStatusChange={(status) => handleFollowStatusChange(user.id, status)}
            />
          ))
        ) : usersList.length > 0 ? (
          // Show "no search results" message
          <div className="text-center py-8">
            <Search size={48} className="mx-auto text-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No results found</h3>
            <p className="text-text-secondary">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          // Show "no users" message
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-text-disabled mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No {type} yet
            </h3>
            <p className="text-text-secondary">
              {type === 'followers' 
                ? isOwnProfile 
                  ? "You don't have any followers yet. Share your profile to get started!"
                  : "This user doesn't have any followers yet."
                : isOwnProfile
                  ? "You're not following anyone yet. Find interesting people to follow!"
                  : "This user isn't following anyone yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
