'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Shield,
  Eye,
  Users,
  Save,
  AlertCircle
} from 'lucide-react';
import { activity as activityAPI } from '@/lib/api';

export default function ActivitySettings() {
  const [settings, setSettings] = useState({
    show_posts: true,
    show_comments: true,
    show_likes: true,
    show_to_followers_only: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await activityAPI.getActivitySettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');
      
      await activityAPI.updateActivitySettings(settings);
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-background rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-border rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-border rounded w-32"></div>
                    <div className="h-3 bg-border rounded w-48"></div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-border rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-gradient rounded-full flex items-center justify-center">
          <SettingsIcon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Activity Privacy Settings</h2>
          <p className="text-text-secondary text-sm">
            Control what activities are visible to other users
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-error flex-shrink-0" />
          <span className="text-error">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-success">{successMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Show Posts Setting */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <SettingsIcon size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Show Posts</h3>
              <p className="text-sm text-text-secondary">
                Display when you create new posts in your activity timeline
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_posts}
              onChange={(e) => handleSettingChange('show_posts', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer 
                         peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                         peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Show Comments Setting */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
              <SettingsIcon size={18} className="text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Show Comments</h3>
              <p className="text-sm text-text-secondary">
                Display when you comment on posts in your activity timeline
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_comments}
              onChange={(e) => handleSettingChange('show_comments', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer 
                         peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                         peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Show Likes Setting */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center">
              <SettingsIcon size={18} className="text-error" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Show Reactions</h3>
              <p className="text-sm text-text-secondary">
                Display when you like or dislike posts and comments
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_likes}
              onChange={(e) => handleSettingChange('show_likes', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer 
                         peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                         peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Followers Only Setting */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
              <Shield size={18} className="text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Followers Only</h3>
              <p className="text-sm text-text-secondary">
                Only show your activities to users who follow you
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_to_followers_only}
              onChange={(e) => handleSettingChange('show_to_followers_only', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer 
                         peer-checked:after:translate-x-full peer-checked:after:border-white 
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                         after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                         peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-info/10 border border-info rounded-lg">
          <div className="flex items-start gap-3">
            <Eye size={20} className="text-info flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-text-primary mb-1">Privacy Notice</h4>
              <p className="text-sm text-text-secondary">
                These settings control the visibility of your activity timeline to other users. 
                Your posts and comments will still be visible according to their individual privacy settings.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary-hover disabled:bg-border 
                     text-white px-6 py-2 rounded-lg flex items-center gap-2 
                     transition-colors disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
