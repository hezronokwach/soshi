/**
 * Migration: Add Post Reactions
 * Adds support for post likes and dislikes
 */

async function up(db) {
  // Add reaction counts to posts table
  await db.exec(`ALTER TABLE posts ADD COLUMN like_count INTEGER DEFAULT 0`);
  await db.exec(`ALTER TABLE posts ADD COLUMN dislike_count INTEGER DEFAULT 0`);

  // Create post_reactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS post_reactions (
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reaction_type TEXT NOT NULL CHECK(reaction_type IN ('like', 'dislike')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for faster reaction lookups
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions (post_id)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions (user_id)`);
}

async function down(db) {
  await db.exec(`DROP INDEX IF EXISTS idx_post_reactions_user_id`);
  await db.exec(`DROP INDEX IF EXISTS idx_post_reactions_post_id`);
  await db.exec(`DROP TABLE IF EXISTS post_reactions`);
  
  // Remove reaction count columns from posts
  await db.exec(`PRAGMA foreign_keys=off`);
  
  await db.exec(`
    CREATE TABLE posts_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      privacy TEXT NOT NULL DEFAULT 'public',
      group_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
    )
  `);
  
  await db.exec(`
    INSERT INTO posts_temp 
    SELECT id, user_id, content, image_url, privacy, group_id, 
           created_at, updated_at, deleted_at
    FROM posts
  `);
  
  await db.exec(`DROP TABLE posts`);
  await db.exec(`ALTER TABLE posts_temp RENAME TO posts`);
  await db.exec(`PRAGMA foreign_keys=on`);
}

// Use CommonJS exports for compatibility with require()
module.exports = { up, down };