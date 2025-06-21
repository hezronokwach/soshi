'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Globe, 
  Lock,
  Edit2,
  Mail,
  UserCheck,
  Users
} from 'lucide-react';
import FollowButton from '@/components/connections/FollowButton';
import { users } from '@/lib/api';

export default function ProfileDisplay({ 
  user, 
  isOwnProfile = false, 
  onEditClick = null,
  profileData = null 
}) {
  // Use profileData if available, otherwise fall back to user
  const profile = profileData || user;
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchFollowCounts();
    }
  }, [profile?.id]);

  const fetchFollowCounts = async () => {
    try {
      setCountsLoading(true);
      const counts = await users.getFollowCounts(isOwnProfile ? null : profile.id);
      setFollowCounts(counts);
    } catch (error) {
      console.error('Failed to fetch follow counts:', error);
    } finally {
      setCountsLoading(false);
    }
  };
  
  if (!profile) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="text-center text-text-secondary">
          Loading profile...
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header with privacy indicator */}
      <div className="bg-primary-gradient p-6 relative">
        {isOwnProfile && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {profile.is_public ? (
              <div className="flex items-center gap-1 bg-background/20 px-2 py-1 rounded-full text-xs">
                <Globe size={12} />
                Public
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-background/20 px-2 py-1 rounded-full text-xs">
                <Lock size={12} />
                Private
              </div>
            )}
          </div>
        )}
        
        {/* Avatar and basic info */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-background/20 rounded-full flex items-center justify-center text-2xl font-semibold">
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-white">
                {getInitials(profile.first_name, profile.last_name)}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.nickname && (
              <p className="text-white/80 mb-2">
                "@{profile.nickname}"
              </p>
            )}
            <div className="flex items-center gap-2 text-white/60">
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isOwnProfile && (
              <FollowButton 
                targetUserID={profile.id} 
                onStatusChange={fetchFollowCounts}
              />
            )}
            
            {isOwnProfile && onEditClick && (
              <button
                onClick={onEditClick}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg 
                         flex items-center gap-2 transition-colors"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile content */}
      <div className="p-6 space-y-6">
        {/* About section */}
        {profile.about_me && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <User size={18} />
              About Me
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {profile.about_me}
            </p>
          </div>
        )}

        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of birth */}
          {profile.date_of_birth && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-primary" />
              <div>
                <span className="text-text-secondary text-sm">Date of Birth</span>
                <p className="text-text-primary font-medium">
                  {formatDate(profile.date_of_birth)}
                </p>
              </div>
            </div>
          )}

          {/* Member since */}
          {profile.created_at && (
            <div className="flex items-center gap-3">
              <UserCheck size={18} className="text-primary" />
              <div>
                <span className="text-text-secondary text-sm">Member Since</span>
                <p className="text-text-primary font-medium">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Social stats */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">0</div>
              <div className="text-text-secondary text-sm">Posts</div>
            </div>
            <div className="text-center cursor-pointer hover:bg-background/50 p-2 rounded-lg transition-colors">
              <div className="text-2xl font-bold text-text-primary">
                {countsLoading ? '...' : followCounts.followers}
              </div>
              <div className="text-text-secondary text-sm">Followers</div>
            </div>
            <div className="text-center cursor-pointer hover:bg-background/50 p-2 rounded-lg transition-colors">
              <div className="text-2xl font-bold text-text-primary">
                {countsLoading ? '...' : followCounts.following}
              </div>
              <div className="text-text-secondary text-sm">Following</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
