'use client';

import { useState } from 'react';
import { 
  Heart, 
  ThumbsDown, 
  MessageCircle, 
  FileText,
  EyeOff,
  Eye,
  MoreHorizontal,
  User as UserIcon
} from 'lucide-react';

export default function ActivityItem({ 
  activity, 
  onHide, 
  onUnhide,
  isOwnActivity = false 
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'post_created':
        return <FileText className="text-primary" size={20} />;
      case 'comment_created':
        return <MessageCircle className="text-secondary" size={20} />;
      case 'post_liked':
      case 'comment_liked':
        return <Heart className="text-error fill-error" size={20} />;
      case 'post_disliked':
      case 'comment_disliked':
        return <ThumbsDown className="text-warning fill-warning" size={20} />;
      default:
        return <UserIcon className="text-text-secondary" size={20} />;
    }
  };

  const getActivityDescription = () => {
    const { activity_type, target_type, user, target_user, metadata } = activity;

    switch (activity_type) {
      case 'post_created':
        return (
          <span>
            <span className="font-semibold text-text-primary">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-text-secondary"> created a new post</span>
            {metadata?.content_preview && (
              <span className="text-text-secondary">: "{metadata.content_preview}"</span>
            )}
          </span>
        );

      case 'comment_created':
        return (
          <span>
            <span className="font-semibold text-text-primary">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-text-secondary"> commented</span>
            {target_user && target_user.id !== user?.id && (
              <span className="text-text-secondary">
                {' '}on <span className="font-semibold text-text-primary">
                  {target_user.first_name} {target_user.last_name}
                </span>'s post
              </span>
            )}
            {metadata?.content_preview && (
              <span className="text-text-secondary">: "{metadata.content_preview}"</span>
            )}
          </span>
        );

      case 'post_liked':
        return (
          <span>
            <span className="font-semibold text-text-primary">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-text-secondary"> liked</span>
            {target_user && target_user.id !== user?.id && (
              <span className="text-text-secondary">
                {' '}<span className="font-semibold text-text-primary">
                  {target_user.first_name} {target_user.last_name}
                </span>'s post
              </span>
            )}
            {target_user && target_user.id === user?.id && (
              <span className="text-text-secondary"> their own post</span>
            )}
          </span>
        );

      case 'post_disliked':
        return (
          <span>
            <span className="font-semibold text-text-primary">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-text-secondary"> disliked</span>
            {target_user && target_user.id !== user?.id && (
              <span className="text-text-secondary">
                {' '}<span className="font-semibold text-text-primary">
                  {target_user.first_name} {target_user.last_name}
                </span>'s post
              </span>
            )}
            {target_user && target_user.id === user?.id && (
              <span className="text-text-secondary"> their own post</span>
            )}
          </span>
        );

      case 'comment_liked':
      case 'comment_disliked':
        const reactionType = activity_type.includes('liked') ? 'liked' : 'disliked';
        return (
          <span>
            <span className="font-semibold text-text-primary">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-text-secondary"> {reactionType}</span>
            {target_user && target_user.id !== user?.id && (
              <span className="text-text-secondary">
                {' '}<span className="font-semibold text-text-primary">
                  {target_user.first_name} {target_user.last_name}
                </span>'s comment
              </span>
            )}
            {target_user && target_user.id === user?.id && (
              <span className="text-text-secondary"> their own comment</span>
            )}
          </span>
        );

      default:
        return (
          <span>
            <span className="font-semibold text-text-primary">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-text-secondary"> performed an action</span>
          </span>
        );
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className={`bg-surface border border-border rounded-lg p-4 transition-opacity ${
      activity.is_hidden ? 'opacity-50' : 'opacity-100'
    }`}>
      <div className="flex items-start gap-3">
        {/* Activity Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-background rounded-full flex items-center justify-center">
          {getActivityIcon(activity.activity_type)}
        </div>

        {/* User Avatar */}
        <div className="flex-shrink-0">
          {activity.user?.avatar ? (
            <img 
              src={activity.user.avatar} 
              alt={`${activity.user.first_name} ${activity.user.last_name}`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-semibold text-white">
              {getInitials(activity.user?.first_name, activity.user?.last_name)}
            </div>
          )}
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">
                {getActivityDescription()}
              </p>
              
              {/* Post/Comment Preview */}
              {activity.post && (
                <div className="mt-2 p-3 bg-background rounded-lg border border-border">
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {activity.post.content}
                  </p>
                  {activity.post.image_url && (
                    <img 
                      src={activity.post.image_url} 
                      alt="Post content"
                      className="mt-2 max-w-full h-20 object-cover rounded"
                    />
                  )}
                </div>
              )}

              {activity.comment && (
                <div className="mt-2 p-3 bg-background rounded-lg border border-border">
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {activity.comment.content}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            {isOwnActivity && (
              <div className="relative ml-2">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  <MoreHorizontal size={16} className="text-text-secondary" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-surface border border-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        if (activity.is_hidden) {
                          onUnhide?.(activity.id);
                        } else {
                          onHide?.(activity.id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors flex items-center gap-2"
                    >
                      {activity.is_hidden ? (
                        <>
                          <Eye size={14} />
                          Show
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          Hide
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-text-disabled">
              {formatTimeAgo(activity.created_at)}
            </span>
            
            {activity.is_hidden && (
              <span className="text-xs text-warning flex items-center gap-1">
                <EyeOff size={12} />
                Hidden
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
