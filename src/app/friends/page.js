'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { users } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import { Users, Search, UserPlus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [onlineData, allData] = await Promise.all([
        users.getOnlineUsers(),
        users.getAllUsers()
      ]);
      setOnlineUsers(onlineData || []);
      setAllUsers(allData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const filteredUsers = (activeTab === 'online' ? onlineUsers : allUsers).filter(u =>
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">Please log in to view friends.</p>
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
          
          {/* Main Content */}
          <main className="flex-1 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-surface border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">All Users</h1>
                  <p className="text-text-secondary">Discover and connect with people in the community</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-background hover:bg-border text-text-primary'
                  }`}
                >
                  All Users ({allUsers.length})
                </button>
                <button
                  onClick={() => setActiveTab('online')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'online'
                      ? 'bg-primary text-white'
                      : 'bg-background hover:bg-border text-text-primary'
                  }`}
                >
                  Online Users ({onlineUsers.length})
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-surface border border-border rounded-lg p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-text-secondary">Loading users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus size={48} className="mx-auto text-text-secondary mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {searchTerm ? 'No users found' : `No ${activeTab} users`}
                  </h3>
                  <p className="text-text-secondary">
                    {searchTerm ? 'Try adjusting your search terms' : 'Check back later for more users'}
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
                          {activeTab === 'online' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">
                            {userItem.first_name} {userItem.last_name}
                          </h3>
                          <p className="text-sm text-text-secondary truncate">
                            {userItem.nickname ? `@${userItem.nickname}` : 'User'}
                            {activeTab === 'online' && ' • Online'}
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
                        {activeTab === 'online' && (
                          <button
                            onClick={() => handleChatWithUser(userItem.id)}
                            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat
                          </button>
                        )}
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
