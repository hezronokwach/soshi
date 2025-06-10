// Authentication utilities
import { cookies } from 'next/headers';
import { getUserByEmail, getUserById } from './db/models/user';
import { verifyPassword } from './auth/password';
import { createSession as createDbSession } from './db/models/session';

// Session duration in seconds (7 days)
const SESSION_DURATION = 7 * 24 * 60 * 60;

/**
 * Create a session for a user
 * @param {Object} user - The user object
 * @returns {Promise<boolean>} - True if successful
 */
export async function createSession(user) {
  try {
    // Create a simple token that includes the user ID
    const token = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Set the session token in a cookie
    // In Next.js App Router, we need to use the Response API for cookies
    // This will be handled by the API route that calls this function

    return {
      token,
      userId: user.id
    };
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
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken) {
      return null;
    }

    // For now, we'll just return a simple session object
    // In a real implementation, you would verify the token against the database
    const tokenParts = sessionToken.value.split('_');
    if (tokenParts.length < 1) {
      return null;
    }

    return {
      token: sessionToken.value,
      userId: parseInt(tokenParts[0], 10)
    };
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
  // This function is now handled directly in the logout API route
  // by setting the cookie in the response
  return true;
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
