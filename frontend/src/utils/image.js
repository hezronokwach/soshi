/**
 * Utility functions for handling images and avatars
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Get the full URL for an avatar image
 * @param {string} avatarPath - The avatar path from the API
 * @returns {string} The full URL to the avatar
 */
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return '';
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // If it's a data URL (from file preview), return as is
  if (avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  
  // If it's a relative path, prepend the API base URL
  if (avatarPath.startsWith('/')) {
    return `${API_BASE_URL}${avatarPath}`;
  }
  
  // Default case - assume it's a relative path
  return `${API_BASE_URL}/${avatarPath}`;
}

/**
 * Get the full URL for any image (posts, comments, etc.)
 * @param {string} imagePath - The image path from the API
 * @returns {string} The full URL to the image
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a data URL (from file preview), return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the API base URL
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // Default case - assume it's a relative path
  return `${API_BASE_URL}/${imagePath}`;
}

/**
 * Get initials from first and last name
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {string} The initials
 */
export function getInitials(firstName, lastName) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}
