'use client';

import Link from 'next/link';
import FollowButton from './FollowButton';
import { 
  User as UserIcon,
  MapPin,
  Calendar
} from 'lucide-react';

export default function UserCard({ 
  user, 
  showFollowButton = true,
  onFollowStatusChange = null 
}) {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:bg-border/50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={`${user.first_name} ${user.last_name}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(user.first_name, user.last_name)}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link 
                href={`/profile/${user.id}`}
                className="block hover:text-primary transition-colors"
              >
                <h3 className="font-semibold text-text-primary truncate">
                  {user.first_name} {user.last_name}
                </h3>
                {user.nickname && (
                  <p className="text-text-secondary text-sm truncate">
                    @{user.nickname}
                  </p>
                )}
              </Link>

              {user.about_me && (
                <p className="text-text-secondary text-sm mt-2 line-clamp-2">
                  {user.about_me}
                </p>
              )}

              {/* User metadata */}
              <div className="flex items-center gap-4 mt-2 text-xs text-text-disabled">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
                
                {!user.is_public && (
                  <div className="flex items-center gap-1">
                    <UserIcon size={12} />
                    <span>Private</span>
                  </div>
                )}
              </div>
            </div>

            {/* Follow Button */}
            {showFollowButton && (
              <div className="flex-shrink-0">
                <FollowButton 
                  targetUserID={user.id}
                  onStatusChange={onFollowStatusChange}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
