"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Home, 
  User, 
  Users, 
  Calendar, 
  MessageSquare, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Settings,
  ChevronRight,
  ChevronDown
} from "lucide-react";

export default function LeftSidebar() {
  const [expandedSections, setExpandedSections] = useState({
    posts: false,
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <aside className="hidden lg:block fixed left-0 top-navbar bottom-0 w-sidebar bg-background-lighter border-r border-background-light overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-1">
          {/* Main Navigation */}
          <Link 
            href="/" 
            className="flex items-center gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
          >
            <Home className="h-5 w-5 text-primary" />
            <span>Home</span>
          </Link>
          
          <Link 
            href="/profile" 
            className="flex items-center gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
          >
            <User className="h-5 w-5 text-secondary" />
            <span>Profile</span>
          </Link>
          
          {/* Posts Section with Dropdown */}
          <div>
            <button 
              onClick={() => toggleSection('posts')}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-tertiary" />
                <span>Posts</span>
              </div>
              {expandedSections.posts ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </button>
            
            {expandedSections.posts && (
              <div className="ml-8 mt-1 space-y-1">
                <Link 
                  href="/posts/liked" 
                  className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background-light rounded-md"
                >
                  <Heart className="h-4 w-4 text-error" />
                  <span>Liked Posts</span>
                </Link>
                <Link 
                  href="/posts/commented" 
                  className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background-light rounded-md"
                >
                  <MessageSquare className="h-4 w-4 text-info" />
                  <span>Commented Posts</span>
                </Link>
                <Link 
                  href="/posts/saved" 
                  className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background-light rounded-md"
                >
                  <Bookmark className="h-4 w-4 text-warning" />
                  <span>Saved Posts</span>
                </Link>
              </div>
            )}
          </div>
          
          <Link 
            href="/groups" 
            className="flex items-center gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
          >
            <Users className="h-5 w-5 text-success" />
            <span>Groups</span>
          </Link>
          
          <Link 
            href="/events" 
            className="flex items-center gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
          >
            <Calendar className="h-5 w-5 text-warning" />
            <span>Events</span>
          </Link>
          
          <Link 
            href="/chat" 
            className="flex items-center gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
          >
            <MessageSquare className="h-5 w-5 text-info" />
            <span>Messages</span>
          </Link>
        </nav>
        
        <hr className="my-4 border-background-light" />
        
        {/* Secondary Navigation */}
        <nav className="space-y-1">
          <Link 
            href="/settings" 
            className="flex items-center gap-3 px-3 py-2 text-text-primary hover:bg-background-light rounded-md"
          >
            <Settings className="h-5 w-5 text-text-secondary" />
            <span>Settings</span>
          </Link>
        </nav>
        
        {/* User Stats */}
        <div className="mt-8 p-4 bg-background rounded-lg border border-background-light">
          <h3 className="text-sm font-medium text-text-primary mb-2">Your Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Posts</span>
              <span className="text-text-primary text-sm font-medium">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Followers</span>
              <span className="text-text-primary text-sm font-medium">142</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Following</span>
              <span className="text-text-primary text-sm font-medium">98</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
