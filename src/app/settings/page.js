'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { users } from '@/lib/api';
import { User, Mail, Lock, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    nickname: '',
    bio: '',
    date_of_birth: '',
    is_private: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        nickname: user.nickname || '',
        bio: user.bio || '',
        date_of_birth: user.date_of_birth || '',
        is_private: user.is_private || false
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await users.updateProfile(profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }
    try {
      setLoading(true);
      await users.changePassword(passwordData.currentPassword, passwordData.newPassword);
      alert('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async (e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await users.deleteAccount(deletePassword);
      alert('Account deleted successfully. You will be logged out.');
      logout();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please check your password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      setLoading(true);
      await users.updatePrivacy(!profileData.is_private);
      setProfileData(prev => ({ ...prev, is_private: !prev.is_private }));
      alert('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Error updating privacy:', error);
      alert('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Mail },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <p className="text-gray-400">Please log in to access settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <Card className="p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-white">Profile Information</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={profileData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        rows="3"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={profileData.date_of_birth}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-white">Account Settings</h2>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-600 rounded-lg">
                      <h3 className="font-medium text-white mb-2">Change Password</h3>
                      <p className="text-gray-400 text-sm mb-3">Update your password to keep your account secure.</p>

                      {!showPasswordForm ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowPasswordForm(true)}
                        >
                          Change Password
                        </Button>
                      ) : (
                        <form onSubmit={handlePasswordChange} className="space-y-3 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                              required
                              minLength="6"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                              required
                              minLength="6"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                              {loading ? 'Changing...' : 'Change Password'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowPasswordForm(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="p-4 border border-red-600 rounded-lg">
                      <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                      <p className="text-gray-400 text-sm mb-3">Once you delete your account, there is no going back.</p>

                      {!showDeleteForm ? (
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteForm(true)}
                        >
                          Delete Account
                        </Button>
                      ) : (
                        <form onSubmit={handleAccountDeletion} className="space-y-3 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Enter your password to confirm account deletion
                            </label>
                            <input
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                              placeholder="Your password"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" variant="destructive" disabled={loading}>
                              {loading ? 'Deleting...' : 'Delete Account'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowDeleteForm(false);
                                setDeletePassword('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-white">Privacy Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Private Account</h3>
                        <p className="text-gray-400 text-sm">Make your account private</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.is_private}
                          onChange={handlePrivacyUpdate}
                          className="sr-only peer"
                          disabled={loading}
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}


            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
