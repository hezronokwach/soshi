// User model
import { getDb } from '../index';
import { hashPassword } from '../../auth/password';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<number>} - The ID of the created user
 */
export async function createUser(userData) {
  const db = await getDb();

  try {
    const {
      email,
      password,
      first_name,
      last_name,
      date_of_birth,
      avatar = null,
      nickname = null,
      about_me = null
    } = userData;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const result = await db.run(
      `INSERT INTO users (
        email, password, first_name, last_name,
        date_of_birth, avatar, nickname, about_me
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, first_name, last_name, date_of_birth, avatar, nickname, about_me]
    );

    return result.lastID;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserById(id) {
  const db = await getDb();

  try {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  const db = await getDb();

  try {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export async function updateUser(id, userData) {
  const db = await getDb();

  try {
    const {
      first_name,
      last_name,
      avatar,
      nickname,
      about_me,
      is_public
    } = userData;

    await db.run(
      `UPDATE users SET
        first_name = ?,
        last_name = ?,
        avatar = ?,
        nickname = ?,
        about_me = ?,
        is_public = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [first_name, last_name, avatar, nickname, about_me, is_public, id]
    );

    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}
