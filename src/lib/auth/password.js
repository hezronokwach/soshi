/**
 * Password hashing and verification utilities
 */
import bcryptjs from 'bcryptjs';

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
export async function hashPassword(password) {
  try {
    const salt = await bcryptjs.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcryptjs.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param {string} password - The plain text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if the password matches, false otherwise
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    return await bcryptjs.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Failed to verify password');
  }
}
