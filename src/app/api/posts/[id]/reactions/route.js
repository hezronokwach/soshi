import { getDb } from '@/lib/db';

/**
 * Handle POST request to add/update/remove reaction
 */
export async function POST(req, context) {
  const { id } = await context.params;
  const db = await getDb();
  const postId = parseInt(id);
  
  try {
    const { userId, reactionType } = await req.json();
    
    if (!['like', 'dislike'].includes(reactionType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reaction type' }), 
        { status: 400 }
      );
    }

    let changes = {};

    // Begin transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Check if post exists
      const post = await db.get('SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        throw new Error('Post not found');
      }

      // Check existing reaction
      const existing = await db.get(
        'SELECT reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Remove the reaction if clicking same type
          await db.run(
            'DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?',
            [postId, userId]
          );
          changes[`${reactionType}_count`] = -1;
        } else {
          // Switch reaction type
          await db.run(
            'UPDATE post_reactions SET reaction_type = ? WHERE post_id = ? AND user_id = ?',
            [reactionType, postId, userId]
          );
          changes[`${existing.reaction_type}_count`] = -1;
          changes[`${reactionType}_count`] = 1;
        }
      } else {
        // Add new reaction
        await db.run(
          'INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
          [postId, userId, reactionType]
        );
        changes[`${reactionType}_count`] = 1;
      }

      // Update counts in posts table
      const updates = Object.entries(changes)
        .map(([column, change]) => `${column} = COALESCE(${column}, 0) + ${change}`)
        .join(', ');
        
      if (updates) {
        await db.run(
          `UPDATE posts SET ${updates} WHERE id = ?`,
          [postId]
        );
      }

      // Commit transaction
      await db.run('COMMIT');

      // Return updated counts and user reaction
      const { like_count, dislike_count } = await db.get(
        'SELECT COALESCE(like_count, 0) as like_count, COALESCE(dislike_count, 0) as dislike_count FROM posts WHERE id = ?',
        [postId]
      );

      return new Response(JSON.stringify({
        likeCount: like_count || 0,
        dislikeCount: dislike_count || 0,
        userReaction: changes[`${reactionType}_count`] === 1 ? reactionType : null
      }));

    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error handling reaction:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update reaction' }), 
      { status: 500 }
    );
  }
}

/**
 * Handle GET request to get reaction status
 */
export async function GET(req, context) {
  const { id } = await context.params;
  const db = await getDb();
  const postId = parseInt(id);
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }), 
        { status: 400 }
      );
    }

    // Get post counts and user's reaction
    const [counts, userReaction] = await Promise.all([
      db.get(
        'SELECT COALESCE(like_count, 0) as like_count, COALESCE(dislike_count, 0) as dislike_count FROM posts WHERE id = ?',
        [postId]
      ),
      db.get(
        'SELECT reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      )
    ]);

    if (!counts) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }), 
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({
      likeCount: counts.like_count || 0,
      dislikeCount: counts.dislike_count || 0,
      userReaction: userReaction?.reaction_type || null
    }));

  } catch (error) {
    console.error('Error getting reaction status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get reaction status' }), 
      { status: 500 }
    );
  }
}