'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    async function loadUserFromSession() {
      try {
        // const response = await fetch('/api/auth/session');
        // const data = await response.json();
        const data = await auth.getSession();
        if (data.user) {
          setUser(data.user);
        } else if (data.id) {
          setUser(data);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromSession();
  }, []);

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
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(userData),
      // });

      // const data = await response.json();
      const data = await auth.register(userData);

      // if (!response.ok) {
      //   if (data.issues) {
      //     // Format validation errors
      //     const errorMessage = data.issues.map(issue => issue.message).join(', ');
      //     throw new Error(errorMessage);
      //   }
      //   throw new Error(data.error || 'Registration failed');
      // }


      router.push('/login?registered=true');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      // });
      await auth.logout();
      setUser(null);
      router.replace('/login');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
