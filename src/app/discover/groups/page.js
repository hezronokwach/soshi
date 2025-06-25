'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { groups } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import { Search, Users, Hash, Globe, Lock } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverGroupsPage() {
  const { user } = useAuth();
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchAllGroups();
    }
  }, [user]);

  const fetchAllGroups = async () => {
    try {
      setLoading(true);
      const data = await groups.getAll();
      setAllGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'technology', name: 'Technology' },
    { id: 'sports', name: 'Sports' },
    { id: 'music', name: 'Music' },
    { id: 'art', name: 'Art' },
    { id: 'education', name: 'Education' },
    { id: 'business', name: 'Business' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'other', name: 'Other' }
  ];

  const filteredGroups = allGroups.filter(group => {
    const matchesSearch = group.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-text-secondary">Please log in to discover groups.</p>
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
                  <Hash size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Discover Groups</h1>
                  <p className="text-text-secondary">Find and join communities that interest you</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary text-white'
                        : 'bg-background hover:bg-border text-text-primary border border-border'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Groups List */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                  Groups ({filteredGroups.length})
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-text-secondary">Loading groups...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-text-secondary mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {searchTerm || selectedCategory !== 'all' ? 'No groups found' : 'No groups available'}
                  </h3>
                  <p className="text-text-secondary">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filter' 
                      : 'Check back later for new groups'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block p-4 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {group.avatar ? (
                            <img
                              src={group.avatar}
                              alt={group.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Users size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate mb-1">
                            {group.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            {group.is_public ? (
                              <Globe size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                            <span>{group.is_public ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">
                          {group.member_count || 0} members
                        </span>
                        <span className="px-2 py-1 bg-border rounded-full text-text-secondary capitalize">
                          {group.category || 'other'}
                        </span>
                      </div>
                    </Link>
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
