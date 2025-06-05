// Post model
import { getDb } from '../index';

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @returns {Promise<number>} - The ID of the created post
 */
export async function createPost(postData) {
  const db = await getDb();

  try {
    const {
      user_id,
      content,
      image_url = null,
      privacy = 'public',
      group_id = null,
      selected_users = []
    } = postData;

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    // Create post
    const result = await db.run(
      `INSERT INTO posts (
        user_id, content, image_url, privacy, group_id
      ) VALUES (?, ?, ?, ?, ?)`,
      [user_id, content, image_url, privacy, group_id]
    );

    const postId = result.lastID;

    // If private post, add selected users
    if (privacy === 'private' && selected_users.length > 0) {
      const stmt = await db.prepare(
        'INSERT INTO post_privacy_users (post_id, user_id) VALUES (?, ?)'
      );

      for (const userId of selected_users) {
        await stmt.run(postId, userId);
      }
      await stmt.finalize();
    }

    await db.run('COMMIT');
    return postId;
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * Get post by ID with privacy check
 * @param {number} id - Post ID
 * @param {number} requestingUserId - ID of user requesting the post
 * @returns {Promise<Object>} - The post data
 */
export async function getPostById(id, requestingUserId) {
  const db = await getDb();

  try {
    const post = await db.get(`
      SELECT 
        p.*, 
        u.first_name, 
        u.last_name, 
        u.avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL AND c.parent_id IS NULL) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `, [id]);

    if (!post) {
      return null;
    }

    // Check privacy
    if (post.privacy === 'private') {
      const hasAccess = await db.get(
        'SELECT 1 FROM post_privacy_users WHERE post_id = ? AND user_id = ?',
        [id, requestingUserId]
      );
      if (!hasAccess && post.user_id !== requestingUserId) {
        return null;
      }
    }

    return post;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    throw error;
  }
}

/**
 * Update a post
 * @param {number} id - Post ID
 * @param {Object} postData - Updated post data
 * @param {number} userId - User making the update
 * @returns {Promise<boolean>} - Success status
 */
export async function updatePost(id, postData, userId) {
  const db = await getDb();

  try {
    // Check post ownership
    const post = await db.get(
      'SELECT user_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!post || post.user_id !== userId) {
      throw new Error('Unauthorized to update this post');
    }

    const {
      content,
      privacy,
      selected_users = []
    } = postData;

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    // Store original content in history
    await db.run(
      `INSERT INTO post_history (post_id, content, editor_id)
       VALUES (?, ?, ?)`,
      [id, content, userId]
    );

    // Update post
    await db.run(
      `UPDATE posts SET
        content = ?,
        privacy = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [content, privacy, id]
    );

    // Update privacy settings if provided
    if (privacy === 'private') {
      // Remove old privacy settings
      await db.run('DELETE FROM post_privacy_users WHERE post_id = ?', [id]);

      // Add new privacy settings
      if (selected_users.length > 0) {
        const stmt = await db.prepare(
          'INSERT INTO post_privacy_users (post_id, user_id) VALUES (?, ?)'
        );
        for (const userId of selected_users) {
          await stmt.run(id, userId);
        }
        await stmt.finalize();
      }
    }

    await db.run('COMMIT');
    return true;
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Soft delete a post
 * @param {number} id - Post ID
 * @param {number} userId - User making the deletion
 * @returns {Promise<boolean>} - Success status
 */
export async function deletePost(id, userId) {
  const db = await getDb();

  try {
    // Check post ownership
    const post = await db.get(
      'SELECT user_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!post || post.user_id !== userId) {
      throw new Error('Unauthorized to delete this post');
    }

    // Soft delete
    await db.run(
      `UPDATE posts 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Get posts for feed
 * @param {Object} options - Feed options
 * @returns {Promise<Array>} - Array of posts
 */
export async function getFeedPosts(options) {
  const db = await getDb();
  const {
    userId,
    page = 1,
    limit = 10,
    privacy = ['public']
  } = options;

  try {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL AND c.parent_id IS NULL) as comment_count

      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL
      AND (
        p.privacy = 'public'
        OR p.user_id = ?
        ${privacy.includes('private') ? `
          OR (p.privacy = 'private' AND EXISTS (
            SELECT 1 FROM post_privacy_users
            WHERE post_id = p.id AND user_id = ?
          ))` : ''}
      )
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const params = [userId];
    if (privacy.includes('private')) {
      params.push(userId);
    }
    params.push(limit, offset);

    return await db.all(query, params);
  } catch (error) {
    console.error('Error getting feed posts:', error);
    throw error;
  }
}

/**
 * Get post edit history
 * @param {number} postId - Post ID
 * @returns {Promise<Array>} - Array of history entries
 */
export async function getPostHistory(postId) {
  const db = await getDb();

  try {
    return await db.all(`
      SELECT 
        ph.*,
        u.first_name,
        u.last_name
      FROM post_history ph
      JOIN users u ON ph.editor_id = u.id
      WHERE ph.post_id = ?
      ORDER BY ph.edited_at DESC
    `, [postId]);
  } catch (error) {
    console.error('Error getting post history:', error);
    throw error;
  }
}