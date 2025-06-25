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
      <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg p-6 shadow-lg">
        <div className="text-center text-[#B8C1CF]">
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
    <div className="bg-[#1A2333] border border-[#2A3343] rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-350 hover:scale-[1.02]">
      {/* Header with privacy indicator */}
      <div className="bg-gradient-to-r from-[#3A86FF] to-[#8338EC] p-6 relative">
        {isOwnProfile && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {profile.is_public ? (
              <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                <Globe size={12} />
                Public
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                <Lock size={12} />
                Private
              </div>
            )}
          </div>
        )}
        
        {/* Avatar and basic info */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center text-2xl font-semibold border-2 border-white/20 shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all duration-350">
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-outfit">
                {getInitials(profile.first_name, profile.last_name)}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 font-outfit">
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.nickname && (
              <p className="text-white/80 mb-2 font-medium">
                "@{profile.nickname}"
              </p>
            )}
            <div className="flex items-center gap-2 text-white/70">
              <Mail size={16} />
              <span className="font-inter">{profile.email}</span>
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
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg 
                         flex items-center gap-2 transition-all duration-250 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] 
                         hover:scale-105 font-medium backdrop-blur-sm border border-white/10"
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
          <div className="bg-[#0F1624] p-4 rounded-lg border border-[#2A3343]">
            <h3 className="text-lg font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2 font-outfit">
              <User size={18} className="text-[#3A86FF]" />
              About Me
            </h3>
            <p className="text-[#B8C1CF] leading-relaxed font-inter">
              {profile.about_me}
            </p>
          </div>
        )}

        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of birth */}
          {profile.date_of_birth && (
            <div className="flex items-center gap-3 bg-[#0F1624] p-4 rounded-lg border border-[#2A3343] hover:border-[#3A86FF] transition-all duration-250">
              <Calendar size={18} className="text-[#3A86FF]" />
              <div>
                <span className="text-[#B8C1CF] text-sm font-medium">Date of Birth</span>
                <p className="text-[#FFFFFF] font-semibold font-inter">
                  {formatDate(profile.date_of_birth)}
                </p>
              </div>
            </div>
          )}

          {/* Member since */}
          {profile.created_at && (
            <div className="flex items-center gap-3 bg-[#0F1624] p-4 rounded-lg border border-[#2A3343] hover:border-[#8338EC] transition-all duration-250">
              <UserCheck size={18} className="text-[#8338EC]" />
              <div>
                <span className="text-[#B8C1CF] text-sm font-medium">Member Since</span>
                <p className="text-[#FFFFFF] font-semibold font-inter">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Social stats */}
        <div className="border-t border-[#2A3343] pt-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center bg-[#0F1624] p-4 rounded-lg border border-[#2A3343] hover:border-[#FF006E] transition-all duration-250 hover:shadow-[0_0_15px_rgba(255,0,110,0.3)]">
              <div className="text-2xl font-bold text-[#FFFFFF] font-outfit">0</div>
              <div className="text-[#B8C1CF] text-sm font-medium">Posts</div>
            </div>
            <div 
              onClick={() => window.location.href = '/profile?tab=connections'}
              className="text-center cursor-pointer bg-[#0F1624] p-4 rounded-lg border border-[#2A3343] hover:border-[#3A86FF] transition-all duration-250 hover:shadow-[0_0_15px_rgba(58,134,255,0.3)] hover:scale-105"
            >
              <div className="text-2xl font-bold text-[#FFFFFF] font-outfit">
                {countsLoading ? '...' : followCounts.followers}
              </div>
              <div className="text-[#B8C1CF] text-sm font-medium">Followers</div>
            </div>
            <div 
              onClick={() => window.location.href = '/profile?tab=connections'}
              className="text-center cursor-pointer bg-[#0F1624] p-4 rounded-lg border border-[#2A3343] hover:border-[#8338EC] transition-all duration-250 hover:shadow-[0_0_15px_rgba(131,56,236,0.3)] hover:scale-105"
            >
              <div className="text-2xl font-bold text-[#FFFFFF] font-outfit">
                {countsLoading ? '...' : followCounts.following}
              </div>
              <div className="text-[#B8C1CF] text-sm font-medium">Following</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
