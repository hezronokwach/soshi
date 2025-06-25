'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { users } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import FollowButton from '@/components/connections/FollowButton';
import { Search, Users, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverPeoplePage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchAllUsers();
    }
  }, [user]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const data = await users.getAllUsers();
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleFollowStatusChange = (userId, status) => {
    // Update the user's follow status in the list
    setAllUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, follow_status: status } : u
    ));
  };

  const filteredUsers = allUsers.filter(u =>
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">Please log in to discover people.</p>
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
                  <UserPlus size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Discover People</h1>
                  <p className="text-text-secondary">Find and connect with new people on Soshi</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                  All Users ({filteredUsers.length})
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-text-secondary">Loading people...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-text-secondary mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {searchTerm ? 'No people found' : 'No users available'}
                  </h3>
                  <p className="text-text-secondary">
                    {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new users'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Link
                        href={`/profile/${userItem.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">
                            {userItem.first_name} {userItem.last_name}
                          </h3>
                          <p className="text-sm text-text-secondary truncate">
                            {userItem.nickname ? `@${userItem.nickname}` : 'User'}
                          </p>
                          {userItem.about_me && (
                            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                              {userItem.about_me}
                            </p>
                          )}
                        </div>
                      </Link>
                      
                      <div className="flex-shrink-0 ml-4">
                        <FollowButton
                          targetUserID={userItem.id}
                          onStatusChange={(status) => handleFollowStatusChange(userItem.id, status)}
                          size="medium"
                        />
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
