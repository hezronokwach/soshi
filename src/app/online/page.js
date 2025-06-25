'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { users } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import { Search, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OnlineUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchOnlineUsers();
    }
  }, [user]);

  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      const onlineData = await users.getOnlineUsers();
      setOnlineUsers(onlineData || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleChatWithUser = (userId) => {
    router.push(`/chat?user=${userId}`);
  };

  const filteredUsers = onlineUsers.filter(u =>
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">Please log in to view online users.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="flex">
          <LeftSidebar />
          
          <main className="flex-1 max-w-4xl mx-auto px-4 py-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Online Users</h1>
                  <p className="text-text-secondary">
                    {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} currently online
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search online users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                           text-text-primary placeholder-text-secondary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-text-secondary">Loading online users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-text-disabled mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {searchTerm ? 'No users found' : 'No users online'}
                  </h3>
                  <p className="text-text-secondary">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'Check back later to see who\'s online'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUsers.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          {userItem.avatar ? (
                            <img
                              src={userItem.avatar}
                              alt={`${userItem.first_name} ${userItem.last_name}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                              {getInitials(userItem.first_name, userItem.last_name)}
                            </div>
                          )}
                          {/* Online indicator */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">
                            {userItem.first_name} {userItem.last_name}
                          </h3>
                          <p className="text-sm text-text-secondary truncate">
                            {userItem.nickname ? `@${userItem.nickname}` : 'User'} • Online
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          href={`/profile/${userItem.id}`}
                          className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-center text-sm font-medium text-text-primary hover:bg-border transition-colors"
                        >
                          View Profile
                        </Link>
                        <button
                          onClick={() => handleChatWithUser(userItem.id)}
                          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          <RightSidebar />
        </div>
      </div>
    </>
  );
}
