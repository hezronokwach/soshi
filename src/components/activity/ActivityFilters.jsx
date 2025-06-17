'use client';

import { useState } from 'react';
import { 
  Filter, 
  FileText, 
  MessageCircle, 
  Heart,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';

export default function ActivityFilters({ filters, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false);

  const activityTypes = [
    { 
      value: 'post_created', 
      label: 'Posts Created', 
      icon: <FileText size={16} />,
      description: 'Posts you created'
    },
    { 
      value: 'comment_created', 
      label: 'Comments', 
      icon: <MessageCircle size={16} />,
      description: 'Comments you made'
    },
    { 
      value: 'post_liked', 
      label: 'Post Likes', 
      icon: <Heart size={16} />,
      description: 'Posts you liked'
    },
    { 
      value: 'post_disliked', 
      label: 'Post Dislikes', 
      icon: <Heart size={16} />,
      description: 'Posts you disliked'
    },
    { 
      value: 'comment_liked', 
      label: 'Comment Likes', 
      icon: <Heart size={16} />,
      description: 'Comments you liked'
    },
    { 
      value: 'comment_disliked', 
      label: 'Comment Dislikes', 
      icon: <Heart size={16} />,
      description: 'Comments you disliked'
    }
  ];

  const handleTypeToggle = (typeValue) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(typeValue)
      ? currentTypes.filter(t => t !== typeValue)
      : [...currentTypes, typeValue];
    
    onFilterChange({
      ...filters,
      types: newTypes
    });
  };

  const handleShowHiddenToggle = () => {
    onFilterChange({
      ...filters,
      showHidden: !filters.showHidden
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      types: [],
      showHidden: false
    });
  };

  const activeFilterCount = (filters.types?.length || 0) + (filters.showHidden ? 1 : 0);

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-primary" />
            <h3 className="font-semibold text-text-primary">Activity Filters</h3>
          </div>
          
          {activeFilterCount > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-text-primary hover:text-primary transition-colors"
          >
            <span className="text-sm">
              {showFilters ? 'Hide' : 'Show'} Filters
            </span>
            <ChevronDown 
              size={16} 
              className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 space-y-4">
          {/* Activity Types */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-3">Activity Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activityTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-3 p-3 bg-background hover:bg-border rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.types?.includes(type.value) || false}
                    onChange={() => handleTypeToggle(type.value)}
                    className="sr-only"
                  />
                  
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    filters.types?.includes(type.value)
                      ? 'bg-primary border-primary text-white'
                      : 'border-border'
                  }`}>
                    {filters.types?.includes(type.value) && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    {type.icon}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {type.label}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Show Hidden Toggle */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-3 p-3 bg-background hover:bg-border rounded-lg cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.showHidden || false}
                onChange={handleShowHiddenToggle}
                className="sr-only"
              />
              
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                filters.showHidden
                  ? 'bg-primary border-primary text-white'
                  : 'border-border'
              }`}>
                {filters.showHidden && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                {filters.showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">
                    Show Hidden Activities
                  </div>
                  <div className="text-xs text-text-secondary">
                    Include activities you've hidden from your timeline
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Quick Filter Buttons */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Quick Filters</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange({ 
                  ...filters, 
                  types: ['post_created', 'comment_created'] 
                })}
                className="px-3 py-1 text-xs bg-background hover:bg-border text-text-primary rounded-full transition-colors"
              >
                Content Only
              </button>
              
              <button
                onClick={() => onFilterChange({ 
                  ...filters, 
                  types: ['post_liked', 'post_disliked', 'comment_liked', 'comment_disliked'] 
                })}
                className="px-3 py-1 text-xs bg-background hover:bg-border text-text-primary rounded-full transition-colors"
              >
                Reactions Only
              </button>
              
              <button
                onClick={() => onFilterChange({ 
                  ...filters, 
                  types: ['post_created'] 
                })}
                className="px-3 py-1 text-xs bg-background hover:bg-border text-text-primary rounded-full transition-colors"
              >
                Posts Only
              </button>
              
              <button
                onClick={() => onFilterChange({ 
                  ...filters, 
                  types: ['comment_created'] 
                })}
                className="px-3 py-1 text-xs bg-background hover:bg-border text-text-primary rounded-full transition-colors"
              >
                Comments Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
