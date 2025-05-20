// Authentication utilities
import { cookies } from 'next/headers';
import { getUserByEmail, getUserById } from './db/models/user';
import { verifyPassword } from './auth/password';
import {
  createSession as createDbSession,
  getSessionByToken,
  deleteSession,
  deleteUserSessions
} from './db/models/session';

// Session duration in seconds (7 days)
const SESSION_DURATION = 7 * 24 * 60 * 60;

/**
 * Create a session for a user
 * @param {Object} user - The user object
 * @returns {Promise<boolean>} - True if successful
 */
export async function createSession(user) {
  try {
    // Create a session in the database
    const session = await createDbSession(user.id, SESSION_DURATION);

    // Set the session token in a cookie
    cookies().set({
      name: 'session_token',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION,
      path: '/'
    });

    return true;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get the current session
 * @returns {Promise<Object|null>} - The session or null if not found
 */
export async function getSession() {
  const sessionToken = cookies().get('session_token');

  if (!sessionToken) {
    return null;
  }

  try {
    // Get session from database
    const session = await getSessionByToken(sessionToken.value);

    if (!session) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user
 * @returns {Promise<Object|null>} - The user or null if not authenticated
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
      // Session exists but user doesn't - clean up the session
      await endSession();
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
 * @returns {Promise<boolean>} - True if successful
 */
export async function endSession() {
  try {
    const sessionToken = cookies().get('session_token');

    if (sessionToken) {
      // Get session from database
      const session = await getSessionByToken(sessionToken.value);

      if (session) {
        // Delete session from database
        await deleteSession(session.id);
      }
    }

    // Delete session cookie
    cookies().delete('session_token');

    return true;
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

/**
 * Authenticate a user with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object|null>} - The user object if authentication is successful, null otherwise
 */
export async function authenticateUser(email, password) {
  try {
    // Get user by email
    const user = await getUserByEmail(email);

    if (!user) {
      return null;
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}
