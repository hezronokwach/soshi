'use client';

import { useState } from 'react';
import { getImageUrl } from '../../utils/image';
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
            <span className="font-semibold text-[#3A86FF]">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[#B8C1CF]"> created a new post</span>
            {metadata?.content_preview && (
              <span className="text-[#B8C1CF]">: "{metadata.content_preview}"</span>
            )}
          </span>
        );

      case 'comment_created':
        return (
          <span>
            <span className="font-semibold text-[#8338EC]">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[#B8C1CF]"> commented</span>
            {target_user && target_user.id !== user?.id && (
              <span className="text-[#B8C1CF]">
                {' '}on <span className="font-semibold text-[#FF006E]">
                  {target_user.first_name} {target_user.last_name}
                </span>'s post
              </span>
            )}
            {metadata?.content_preview && (
              <span className="text-[#B8C1CF]">: "{metadata.content_preview}"</span>
            )}
          </span>
        );

      case 'post_liked':
        return (
          <span>
            <span className="font-semibold text-[#06D6A0]">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[#B8C1CF]"> liked</span>
            {target_user && target_user.id !== user?.id && (
              <span className="text-[#B8C1CF]">
                {' '}<span className="font-semibold text-[#FF006E]">
                  {target_user.first_name} {target_user.last_name}
                </span>'s post
              </span>
            )}
            {target_user && target_user.id === user?.id && (
              <span className="text-[#B8C1CF]"> their own post</span>
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
            <span className="font-semibold text-[#B8C1CF]">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[#B8C1CF]"> performed an action</span>
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
    <div className={`bg-[#1A2333] border border-[#2A3343] rounded-lg p-4 shadow-lg transition-all duration-250 hover:shadow-xl hover:scale-[1.01] ${
      activity.is_hidden ? 'opacity-50' : 'opacity-100'
    }`}>
      <div className="flex items-start gap-3">
        {/* Activity Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-[#0F1624] border border-[#2A3343] rounded-full flex items-center justify-center">
          {getActivityIcon(activity.activity_type)}
        </div>

        {/* User Avatar */}
        <div className="flex-shrink-0">
          {activity.user?.avatar ? (
            <img
              src={getImageUrl(activity.user.avatar)}
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
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm text-[#FFFFFF] font-inter break-words overflow-wrap-anywhere">
                {getActivityDescription()}
              </p>
              
              {/* Post/Comment Preview */}
              {activity.post && (
                <div className="mt-2 p-3 bg-[#0F1624] rounded-lg border border-[#2A3343] overflow-hidden">
                  <p className="text-sm text-[#B8C1CF] break-words overflow-wrap-anywhere font-inter" style={{wordBreak: 'break-word', overflowWrap: 'anywhere', hyphens: 'auto'}}>
                    {activity.post.content.length > 150 ? `${activity.post.content.substring(0, 150)}...` : activity.post.content}
                  </p>
                  {activity.post.image_url && (
                    <img 
                      src={getImageUrl(activity.post.image_url)}
                      alt="Post content"
                      className="mt-2 w-full max-w-full h-20 object-cover rounded border border-[#2A3343]"
                    />
                  )}
                </div>
              )}

              {activity.comment && (
                <div className="mt-2 p-3 bg-[#0F1624] rounded-lg border border-[#2A3343] overflow-hidden">
                  <p className="text-sm text-[#B8C1CF] break-words overflow-wrap-anywhere font-inter" style={{wordBreak: 'break-word', overflowWrap: 'anywhere', hyphens: 'auto'}}>
                    {activity.comment.content.length > 150 ? `${activity.comment.content.substring(0, 150)}...` : activity.comment.content}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            {isOwnActivity && (
              <div className="relative ml-2 flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-[#0F1624] rounded transition-all duration-250 hover:scale-110"
                >
                  <MoreHorizontal size={16} className="text-[#B8C1CF]" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-[#1A2333] border border-[#2A3343] rounded-lg shadow-xl py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        if (activity.is_hidden) {
                          onUnhide?.(activity.id);
                        } else {
                          onHide?.(activity.id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#FFFFFF] hover:bg-[#0F1624] transition-all duration-250 flex items-center gap-2 font-inter"
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
            <span className="text-xs text-[#6C7A89] font-inter">
              {formatTimeAgo(activity.created_at)}
            </span>
            
            {activity.is_hidden && (
              <span className="text-xs text-[#FFD166] flex items-center gap-1 font-inter">
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
