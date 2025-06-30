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
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-lg hover:shadow-glow transition-shadow duration-slow">
      {/* Header with privacy indicator */}
      <div className="bg-primary-gradient p-8 relative">
        {isOwnProfile && (
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {profile.is_public ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-glass px-3 py-2 rounded-full text-sm border border-white/20">
                <Globe size={14} />
                <span className="text-white font-medium">Public</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-glass px-3 py-2 rounded-full text-sm border border-white/20">
                <Lock size={14} />
                <span className="text-white font-medium">Private</span>
              </div>
            )}
          </div>
        )}
        
        {/* Avatar and basic info */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-glass rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-xl group-hover:scale-105 transition-transform duration-normal">
              {profile.avatar ? (
                <img 
                  src={profile.avatar.startsWith('/') ? `http://localhost:8080${profile.avatar}` : profile.avatar}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    console.error('Avatar image failed to load:', profile.avatar);
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => console.log('Avatar loaded successfully:', profile.avatar)}
                />
              ) : (
                <span className="text-white">
                  {getInitials(profile.first_name, profile.last_name)}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-normal"></div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-white mb-3 font-display">
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.nickname && (
              <p className="text-white/90 mb-3 text-lg font-medium">
                @{profile.nickname}
              </p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-3 text-white/80">
              <Mail size={18} />
              <span className="text-lg">{profile.email}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isOwnProfile && (
              <FollowButton 
                targetUserID={profile.id} 
                onStatusChange={fetchFollowCounts}
              />
            )}
            
            {isOwnProfile && onEditClick && (
              <button
                onClick={onEditClick}
                className="bg-white/20 backdrop-blur-glass hover:bg-white/30 text-white px-6 py-3 rounded-xl 
                         flex items-center gap-3 transition-all duration-normal border border-white/20
                         hover:scale-105 hover:shadow-lg font-medium"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile content */}
      <div className="p-8 space-y-8">
        {/* About section */}
        {profile.about_me && (
          <div className="bg-background/30 backdrop-blur-glass rounded-xl p-6 border border-border/50">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3 font-display">
              <div className="p-2 bg-primary/20 rounded-lg">
                <User size={20} className="text-primary" />
              </div>
              About Me
            </h3>
            <p className="text-text-secondary leading-relaxed text-lg">
              {profile.about_me}
            </p>
          </div>
        )}

        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of birth */}
          {profile.date_of_birth && (
            <div className="bg-background/30 backdrop-blur-glass rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-colors duration-normal">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Calendar size={22} className="text-primary" />
                </div>
                <div>
                  <span className="text-text-secondary text-sm font-medium">Date of Birth</span>
                  <p className="text-text-primary font-semibold text-lg">
                    {formatDate(profile.date_of_birth)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Member since */}
          {profile.created_at && (
            <div className="bg-background/30 backdrop-blur-glass rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-colors duration-normal">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <UserCheck size={22} className="text-secondary" />
                </div>
                <div>
                  <span className="text-text-secondary text-sm font-medium">Member Since</span>
                  <p className="text-text-primary font-semibold text-lg">
                    {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Social stats */}
        <div className="bg-dark-gradient rounded-xl p-6 border border-border/50">
          <div className="flex items-center justify-around gap-6">
            <div className="text-center group">
              <div className="p-4 bg-background/50 rounded-xl border border-border/30 group-hover:border-primary/50 transition-colors duration-normal">
                <div className="text-3xl font-bold text-text-primary mb-2 font-display">0</div>
                <div className="text-text-secondary text-sm font-medium">Posts</div>
              </div>
            </div>
            <div className="text-center cursor-pointer group">
              <div className="p-4 bg-background/50 rounded-xl border border-border/30 group-hover:border-secondary/50 hover:bg-secondary/10 transition-all duration-normal">
                <div className="text-3xl font-bold text-text-primary mb-2 font-display">
                  {countsLoading ? '...' : followCounts.followers}
                </div>
                <div className="text-text-secondary text-sm font-medium">Followers</div>
              </div>
            </div>
            <div className="text-center cursor-pointer group">
              <div className="p-4 bg-background/50 rounded-xl border border-border/30 group-hover:border-tertiary/50 hover:bg-tertiary/10 transition-all duration-normal">
                <div className="text-3xl font-bold text-text-primary mb-2 font-display">
                  {countsLoading ? '...' : followCounts.following}
                </div>
                <div className="text-text-secondary text-sm font-medium">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
