'use client';

import { useState, useEffect } from 'react';
import { activity as activityAPI } from '@/lib/api';
import ActivityItem from './ActivityItem';
import ActivityFilters from './ActivityFilters';

export default function ActivityList({ 
  userID = null, 
  isOwnActivity = false,
  initialFilters = {} 
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    types: [],
    showHidden: false,
    ...initialFilters
  });

  const fetchActivities = async (pageNum = 1, currentFilters = filters, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: 20,
        ...currentFilters
      };

      const data = await activityAPI.getUserActivities(userID, params);
      
      if (append) {
        setActivities(prev => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      
      setHasMore(data.activities.length === params.limit);
    } catch (err) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, filters, false);
  }, [userID, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, filters, true);
  };

  const handleHideActivity = async (activityID) => {
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
      console.error('Failed to hide activity:', err);
    }
  };

  const handleUnhideActivity = async (activityID) => {
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
      console.error('Failed to unhide activity:', err);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-background rounded-full"></div>
                <div className="w-8 h-8 bg-background rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-background rounded w-3/4"></div>
                  <div className="h-3 bg-background rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-error rounded-lg p-6 text-center">
        <div className="text-error mb-2">Failed to load activities</div>
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <button 
          onClick={() => fetchActivities(1, filters, false)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {isOwnActivity && (
        <ActivityFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Activity List */}
      <div className="space-y-4">
        {activities.length > 0 ? (
          <>
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isOwnActivity={isOwnActivity}
                onHide={handleHideActivity}
                onUnhide={handleUnhideActivity}
              />
            ))}

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Load More
                </button>
              </div>
            )}

            {/* Loading more indicator */}
            {loading && activities.length > 0 && (
              <div className="text-center py-4">
                <div className="text-text-secondary">Loading more activities...</div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="text-text-secondary mb-2">No activities found</div>
            <p className="text-text-disabled text-sm">
              {userID 
                ? "This user hasn't performed any visible activities yet."
                : "You haven't performed any activities yet. Start by creating posts or interacting with others!"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
