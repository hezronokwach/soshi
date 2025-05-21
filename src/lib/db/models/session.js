// Session model
import { getDb } from '../index';
import crypto from 'crypto';

/**
 * Create a new session
 * @param {number} userId - The user ID
 * @param {string} token - The session token
 * @param {number} expiresIn - Session duration in seconds
 * @returns {Promise<Object>} - The created session
 */
export async function createSession(userId, token, expiresIn = 7 * 24 * 60 * 60) {
  const db = await getDb();

  try {
    // Calculate expiration date
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Insert session into database
    const result = await db.run(
      `INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [userId, token, expiresAt]
    );

    return {
      id: result.lastID,
      userId,
      token,
      expiresAt
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get a session by token
 * @param {string} token - The session token
 * @returns {Promise<Object|null>} - The session or null if not found
 */
export async function getSessionByToken(token) {
  const db = await getDb();

  try {
    const session = await db.get('SELECT * FROM sessions WHERE token = ?', [token]);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await deleteSession(session.id);
      return null;
    }

    return {
      id: session.id,
      userId: session.user_id,
      token: session.token,
      expiresAt: session.expires_at
    };
  } catch (error) {
    console.error('Error getting session by token:', error);
    throw error;
  }
}

/**
 * Delete a session
 * @param {number} id - The session ID
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteSession(id) {
  const db = await getDb();

  try {
    await db.run('DELETE FROM sessions WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * Delete all sessions for a user
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteUserSessions(userId) {
  const db = await getDb();

  try {
    await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
    return true;
  } catch (error) {
    console.error('Error deleting user sessions:', error);
    throw error;
  }
}

/**
 * Delete expired sessions
 * @returns {Promise<number>} - Number of deleted sessions
 */
export async function deleteExpiredSessions() {
  const db = await getDb();

  try {
    const result = await db.run('DELETE FROM sessions WHERE expires_at < ?', [new Date().toISOString()]);
    return result.changes;
  } catch (error) {
    console.error('Error deleting expired sessions:', error);
    throw error;
  }
}
