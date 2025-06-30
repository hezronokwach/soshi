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
        <div className="flex pt-16"> {/* Add top padding for navbar */}
          <LeftSidebar />

          {/* Main Content */}
          <main className="flex-1 lg:ml-sidebar xl:mr-80">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {/* Header */}
              <div className="glassmorphism p-8 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary-gradient rounded-2xl flex items-center justify-center shadow-xl">
                    <UserPlus size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl lg:text-4xl font-display font-bold text-text-primary mb-2">Discover People</h1>
                    <p className="text-lg text-text-secondary">Find and connect with new people on Soshi</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                  <input
                    type="text"
                    placeholder="Search people by name or nickname..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 text-text-primary placeholder-text-secondary transition-all duration-normal"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="glassmorphism p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-text-primary">
                    People ({filteredUsers.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-text-secondary">Loading people...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface border border-border flex items-center justify-center">
                      <Users size={40} className="text-text-secondary" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
                      {searchTerm ? 'No people found' : 'No users available'}
                    </h3>
                    <p className="text-text-secondary max-w-md mx-auto">
                      {searchTerm ? 'Try adjusting your search terms to find more people' : 'Check back later for new users to connect with'}
                    </p>
                  </div>
                ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                  {filteredUsers.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="glassmorphism p-6 hover:shadow-glow hover:scale-102 transition-all duration-normal animate-hover"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Link
                          href={`/profile/${userItem.id}`}
                          className="flex items-start gap-4 flex-1 min-w-0 group"
                        >
                          <div className="relative">
                            {userItem.avatar ? (
                              <img
                                src={userItem.avatar}
                                alt={`${userItem.first_name} ${userItem.last_name}`}
                                className="w-16 h-16 rounded-full object-cover border border-border group-hover:border-primary transition-colors"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-primary-gradient rounded-full flex items-center justify-center text-white font-display font-bold text-lg shadow-lg">
                                {getInitials(userItem.first_name, userItem.last_name)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-bold text-xl text-text-primary group-hover:text-primary transition-colors">
                              {userItem.first_name} {userItem.last_name}
                            </h3>
                            <p className="text-sm text-text-secondary mb-2">
                              {userItem.nickname ? `@${userItem.nickname}` : 'User'}
                            </p>
                            {userItem.about_me && (
                              <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                                {userItem.about_me}
                              </p>
                            )}
                          </div>
                        </Link>

                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <FollowButton
                            targetUserID={userItem.id}
                            onStatusChange={(status) => handleFollowStatusChange(userItem.id, status)}
                            size="large"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          </main>

          <RightSidebar />
        </div>
      </div>
    </>
  );
}
