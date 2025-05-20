"use client";

import Link from "next/link";
import { User, Users, Plus, X } from "lucide-react";

export default function RightSidebar() {
  // Mock data for suggested users
  const suggestedUsers = [
    { id: 1, name: "Alex Johnson", username: "alexj", mutualFriends: 5 },
    { id: 2, name: "Samantha Lee", username: "samlee", mutualFriends: 3 },
    { id: 3, name: "Marcus Chen", username: "mchen", mutualFriends: 2 },
  ];
  
  // Mock data for suggested groups
  const suggestedGroups = [
    { id: 1, name: "Tech Enthusiasts", members: 1243, category: "Technology" },
    { id: 2, name: "Digital Artists", members: 856, category: "Art" },
    { id: 3, name: "Travel Adventures", members: 2105, category: "Travel" },
  ];
  
  return (
    <aside className="hidden xl:block fixed right-0 top-navbar bottom-0 w-sidebar bg-background-lighter border-l border-background-light overflow-y-auto">
      <div className="p-4">
        {/* Suggested Users */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Suggested Users</h3>
            <Link href="/discover/people" className="text-xs text-primary hover:text-primary-hover">
              See All
            </Link>
          </div>
          
          <div className="space-y-3">
            {suggestedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background-light flex items-center justify-center">
                    <User className="h-5 w-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{user.name}</p>
                    <p className="text-xs text-text-secondary">{user.mutualFriends} mutual connections</p>
                  </div>
                </div>
                <button className="h-8 w-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Suggested Groups */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Suggested Groups</h3>
            <Link href="/discover/groups" className="text-xs text-primary hover:text-primary-hover">
              See All
            </Link>
          </div>
          
          <div className="space-y-3">
            {suggestedGroups.map(group => (
              <div key={group.id} className="p-3 bg-background rounded-lg border border-background-light">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{group.name}</p>
                    <p className="text-xs text-text-secondary">{group.category} • {group.members.toLocaleString()} members</p>
                  </div>
                </div>
                <button className="w-full py-1.5 bg-background-light hover:bg-background-light/80 rounded-md text-sm text-text-primary">
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
