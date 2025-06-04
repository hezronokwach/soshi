"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function SelectFollowersModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialSelected = [] 
}) {
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState(initialSelected);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen]);

  const fetchFollowers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/followers');
      if (!response.ok) throw new Error('Failed to fetch followers');
      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error('Error fetching followers:', error);
      alert('Failed to load followers');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollower = (followerId) => {
    setSelectedFollowers(prev => 
      prev.includes(followerId)
        ? prev.filter(id => id !== followerId)
        : [...prev, followerId]
    );
  };

  const handleSave = () => {
    onSave(selectedFollowers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select Followers</h3>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-4">Loading followers...</div>
          ) : followers.length === 0 ? (
            <div className="text-center py-4 text-text-secondary">No followers found</div>
          ) : (
            <div className="space-y-2">
              {followers.map(follower => (
                <div 
                  key={follower.id}
                  onClick={() => toggleFollower(follower.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer ${selectedFollowers.includes(follower.id) ? 'bg-primary/10' : 'hover:bg-background-darker'}`}
                >
                  <div className="flex items-center flex-1">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 bg-background-darker">
                      {follower.avatar && (
                        <img 
                          src={follower.avatar} 
                          alt={follower.first_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="font-medium">
                      {follower.first_name} {follower.last_name}
                    </span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedFollowers.includes(follower.id)}
                    onChange={() => {}}
                    className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text hover:bg-background-darker rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
