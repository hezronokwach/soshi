// Comment model
import { getDb } from '../index';

/**
 * Create a new comment
 * @param {Object} commentData - Comment data
 * @returns {Promise<number>} - The ID of the created comment
 */
export async function createComment(commentData) {
  const db = await getDb();

  try {
    const {
      post_id,
      user_id,
      parent_id = null,
      content,
      image_url = null
    } = commentData;

    const result = await db.run(
      `INSERT INTO comments (
        post_id, user_id, parent_id, content, image_url
      ) VALUES (?, ?, ?, ?, ?)`,
      [post_id, user_id, parent_id, content, image_url]
    );

    return result.lastID;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

/**
 * Get comments for a post
 * @param {number} postId - Post ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of comments
 */
export async function getPostComments(postId, options = {}) {
  const db = await getDb();
  const {
    page = 1,
    limit = 20,
    parentId = null
  } = options;

  try {
    const offset = (page - 1) * limit;

    // Get comments with user info and reaction counts
    const comments = await db.all(`
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.avatar,
        (SELECT COUNT(*) FROM comments rc WHERE rc.parent_id = c.id AND rc.deleted_at IS NULL) as reply_count,
        (SELECT COUNT(*) FROM comment_reactions cr WHERE cr.comment_id = c.id AND cr.type = 'like') as like_count,
        (SELECT COUNT(*) FROM comment_reactions cr WHERE cr.comment_id = c.id AND cr.type = 'dislike') as dislike_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? 
      AND c.parent_id IS ? 
      AND c.deleted_at IS NULL
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [postId, parentId, limit, offset]);

    return comments;
  } catch (error) {
    console.error('Error getting post comments:', error);
    throw error;
  }
}

/**
 * Get comment by ID
 * @param {number} id - Comment ID
 * @returns {Promise<Object>} - The comment data
 */
export async function getCommentById(id) {
  const db = await getDb();

  try {
    return await db.get(`
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `, [id]);
  } catch (error) {
    console.error('Error getting comment by ID:', error);
    throw error;
  }
}

/**
 * Update a comment
 * @param {number} id - Comment ID
 * @param {Object} commentData - Updated comment data
 * @param {number} userId - User making the update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateComment(id, commentData, userId) {
  const db = await getDb();

  try {
    // Check comment ownership
    const comment = await db.get(
      'SELECT user_id FROM comments WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!comment || comment.user_id !== userId) {
      throw new Error('Unauthorized to update this comment');
    }

    const { content, image_url } = commentData;

    await db.run(
      `UPDATE comments SET
        content = ?,
        image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [content, image_url, id]
    );

    return true;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

/**
 * Delete a comment
 * @param {number} id - Comment ID
 * @param {number} userId - User making the deletion
 * @param {number} postOwnerId - Owner of the post (can delete any comment)
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteComment(id, userId, postOwnerId) {
  const db = await getDb();

  try {
    // Get comment and check authorization
    const comment = await db.get(`
      SELECT c.user_id, c.post_id, p.user_id as post_owner_id 
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `, [id]);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Allow deletion if user is comment owner or post owner
    if (comment.user_id !== userId && comment.post_owner_id !== postOwnerId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Soft delete
    await db.run(
      `UPDATE comments 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Add, update or remove a reaction to a comment
 * @param {Object} reactionData - Reaction data
 * @returns {Promise<Object>} - Updated reaction status
 */
export async function updateCommentReaction(reactionData) {
  const db = await getDb();
  const { comment_id, user_id, type, emoji = null } = reactionData;
  let changes = {};

  await db.run('BEGIN TRANSACTION');

  try {
    // Check existing reaction
    const existing = await db.get(
      'SELECT type FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
      [comment_id, user_id]
    );

    if (existing) {
      if (existing.type === type) {
        // Remove the reaction if clicking same type
        await db.run(
          'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND type = ?',
          [comment_id, user_id, type]
        );
        changes[`${type}Count`] = -1;
      } else {
        // Switch reaction type
        await db.run(
          'UPDATE comment_reactions SET type = ? WHERE comment_id = ? AND user_id = ?',
          [type, comment_id, user_id]
        );
        changes[`${existing.type}Count`] = -1;
        changes[`${type}Count`] = 1;
      }
    } else {
      // Add new reaction
      await db.run(
        'INSERT INTO comment_reactions (comment_id, user_id, type, emoji) VALUES (?, ?, ?, ?)',
        [comment_id, user_id, type, emoji]
      );
      changes[`${type}Count`] = 1;
    }

    await db.run('COMMIT');

    // Get updated reaction status
    return await getCommentReactions(comment_id, user_id);
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error updating comment reaction:', error);
    throw error;
  }
}

/**
 * Get reactions for a comment
 * @param {number} commentId - Comment ID
 * @param {number} userId - User ID to check their reaction
 * @returns {Promise<Object>} - Reaction counts and user's reaction
 */
export async function getCommentReactions(commentId, userId) {
  const db = await getDb();

  try {
    // Get reaction counts
    const [likes, dislikes, userReaction] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM comment_reactions WHERE comment_id = ? AND type = ?', [commentId, 'like']),
      db.get('SELECT COUNT(*) as count FROM comment_reactions WHERE comment_id = ? AND type = ?', [commentId, 'dislike']),
      db.get('SELECT type FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND type IN ("like", "dislike")', [commentId, userId])
    ]);

    return {
      likeCount: likes.count,
      dislikeCount: dislikes.count,
      userReaction: userReaction?.type || null
    };
  } catch (error) {
    console.error('Error getting comment reactions:', error);
    throw error;
  }
}