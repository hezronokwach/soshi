'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { auth, connectWebSocket } from '@/lib/api';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [websocket, setWebsocket] = useState(null);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    async function loadUserFromSession() {
      try {
        const data = await auth.getSession();
        if (data) {
          if (data.user) {
            setUser(data.user);
          } else if (data.id) {
            setUser(data);
          }
        } else {
          // No session data (user not logged in)
          setUser(null);
        }
      } catch (error) {
        // Silently handle session errors (user not logged in)
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromSession();
  }, []);

  // Establish WebSocket connection when user is authenticated
  useEffect(() => {
    if (user && !websocket) {
      try {
        const ws = connectWebSocket((message) => {
          // Handle incoming messages here if needed
        });
        setWebsocket(ws);
      } catch (error) {
        // Silently handle WebSocket connection errors
      }
    } else if (!user && websocket) {
      // Close WebSocket when user logs out
      websocket.close();
      setWebsocket(null);
    }

    // Cleanup function
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [user]); // Only depend on user, not websocket to avoid infinite loops

  // Login function
  const login = async (email, password) => {
    try {
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email, password }),
      // });

      // const data = await response.json();
      

      // if (!response.ok) {
      //   throw new Error(data.error || 'Login failed');
      // }
      const data = await auth.login({ email, password });

      // Reload user data
      // const userResponse = await fetch('/api/auth/session');
      // const userData = await userResponse.json();
      const userData = await auth.getSession();

      if (userData.user) {
        setUser(userData.user);
        router.replace('/feed');
        return true;
      } else if (userData.id) {
        // If userData has an id, it's likely the user object itself
        setUser(userData);
        router.replace('/feed');
        return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const data = await auth.register(userData);
      router.push('/login?registered=true');
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Close WebSocket connection before logout
      if (websocket) {
        websocket.close();
        setWebsocket(null);
      }

      await auth.logout();
      setUser(null);
      router.replace('/login');
      return true;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, websocket, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
