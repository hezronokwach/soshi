"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Users,
  Calendar,
  MessageSquare,
  Heart,
  MessageCircle,
  Bookmark,
  Settings,
  LogOut
} from "lucide-react";

export default function LeftSidebar() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-sidebar bg-surface border-r border-border overflow-y-auto z-20 glassmorphism flex flex-col"
    >
      <div className="flex-1 p-6">
        <nav className="flex flex-col gap-2">
          {/* Main Navigation */}
          <Link
            href="/feed"
            className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 rounded-lg font-medium transition-all duration-normal hover:bg-primary/20 hover:scale-105"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Posts</span>
          </Link>

          <Link
            href="/posts/liked"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <Heart className="w-5 h-5" style={{color: '#EF476F'}} />
            <span>Liked Posts</span>
          </Link>

          <Link
            href="/posts/commented"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <MessageSquare className="w-5 h-5" style={{color: '#118AB2'}} />
            <span>Commented Posts</span>
          </Link>

          <Link
            href="/posts/saved"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <Bookmark className="w-5 h-5" style={{color: '#FFD166'}} />
            <span>Saved Posts</span>
          </Link>

          <hr className="my-6 border-border" />

          <h3 className="text-sm font-display font-semibold text-text-secondary mb-3 px-4 uppercase tracking-wider">Profile</h3>

          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <User className="w-5 h-5" style={{color: '#8338EC'}} />
            <span>My Profile</span>
          </Link>

          <Link
            href="/profile/followers"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <Users className="w-5 h-5" style={{color: '#06D6A0'}} />
            <span>Followers</span>
          </Link>

          <hr className="my-6 border-border" />

          <h3 className="text-sm font-display font-semibold text-text-secondary mb-3 px-4 uppercase tracking-wider">Discover</h3>

          <Link
            href="/groups"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <Users className="w-5 h-5" style={{color: '#06D6A0'}} />
            <span>Groups</span>
          </Link>  

          <Link
            href="/chat"
            className="flex items-center gap-3 px-4 py-3 text-text-primary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <MessageSquare className="w-5 h-5" style={{color: '#118AB2'}} />
            <span>Messages</span>
          </Link>

          <hr className="my-6 border-border" />

          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary rounded-lg font-medium transition-all duration-normal hover:bg-surface/50 hover:scale-105"
          >
            <Settings className="w-5 h-5" style={{color: '#B8C1CF'}} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Logout Button at Bottom */}
      <div className="p-6 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-error rounded-lg font-medium transition-all duration-normal hover:bg-error/10 hover:scale-105"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
