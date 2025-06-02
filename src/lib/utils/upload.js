// File upload utilities
import path from 'path';
import fs from 'fs/promises';

// Allowed file types
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif'
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Save uploaded file to disk
 * @param {File} file - The file to save
 * @param {string} type - Type of upload (e.g., 'posts', 'avatars')
 * @returns {Promise<string>} - The URL of the saved file
 */
export async function saveFile(file, type) {
  try {
    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      throw new Error('Invalid file type. Allowed types: JPG, PNG, GIF');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size: 5MB');
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const extension = ALLOWED_TYPES[file.type];
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    // Return public URL
    return `/uploads/${type}/${filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

/**
 * Delete file from disk
 * @param {string} fileUrl - The URL of the file to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFile(fileUrl) {
  try {
    if (!fileUrl) return true;

    // Get file path from URL
    const filepath = path.join(process.cwd(), 'public', fileUrl);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      // File doesn't exist, consider deletion successful
      return true;
    }

    // Delete file
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @returns {boolean} - Validation result
 */
export function validateFile(file) {
  return (
    file &&
    ALLOWED_TYPES[file.type] &&
    file.size <= MAX_FILE_SIZE
  );
}