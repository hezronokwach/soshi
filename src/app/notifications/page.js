"use client";

import { useState, useEffect } from 'react';
import { notifications } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import { Bell, User, Users, Heart, MessageSquare } from 'lucide-react';

export default function NotificationsPage() {
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notifications.getNotifications();
      setNotificationsList(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notifications.markAsRead(notificationId);
      setNotificationsList(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notifications.markAllAsRead();
      setNotificationsList(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <Users size={20} className="text-primary" />;
      case 'like':
        return <Heart size={20} className="text-error" />;
      case 'comment':
        return <MessageSquare size={20} className="text-secondary" />;
      default:
        return <Bell size={20} className="text-text-secondary" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-4xl p-4 space-y-6" style={{ paddingTop: '5rem' }}>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center">
                <Bell size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
                <p className="text-text-secondary">Stay updated with your latest activities</p>
              </div>
            </div>
            
            {notificationsList.some(notif => !notif.is_read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-background border border-border rounded-lg p-4">
                  <div className="animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 bg-border rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-border rounded w-3/4"></div>
                      <div className="h-3 bg-border rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-error mb-4">
                <Bell size={48} className="mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Error Loading Notifications</h2>
              <p className="text-text-secondary mb-4">{error}</p>
              <button 
                onClick={fetchNotifications}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : notificationsList.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={48} className="mx-auto text-text-disabled mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">No Notifications</h2>
              <p className="text-text-secondary">You&apos;re all caught up! New notifications will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notificationsList.map((notification) => (
                <div 
                  key={notification.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    notification.is_read 
                      ? 'bg-background border-border' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${notification.is_read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                        {notification.message}
                      </p>
                      <p className="text-text-disabled text-sm mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
