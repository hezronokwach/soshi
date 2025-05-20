// Authentication utilities
import { cookies } from 'next/headers';
import { getUserByEmail } from './db/models/user';

// Session duration in seconds (7 days)
const SESSION_DURATION = 7 * 24 * 60 * 60;

/**
 * Create a session for a user
 */
export async function createSession(user) {
  // In a real implementation, you would:
  // 1. Create a session in the database
  // 2. Generate a session token
  // 3. Set the session token in a cookie
  
  // For now, we'll just set a simple cookie with the user ID
  const sessionData = {
    userId: user.id,
    expiresAt: Date.now() + SESSION_DURATION * 1000
  };
  
  // Set the session cookie
  cookies().set({
    name: 'session',
    value: JSON.stringify(sessionData),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION,
    path: '/'
  });
  
  return true;
}

/**
 * Get the current session
 */
export async function getSession() {
  const sessionCookie = cookies().get('session');
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  try {
    // Get user from database
    const user = await getUserById(session.userId);
    
    if (!user) {
      return null;
    }
    
    // Remove sensitive data
    delete user.password;
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * End the current session
 */
export async function endSession() {
  cookies().delete('session');
  return true;
}
