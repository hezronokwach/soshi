/**
 * Migration: Add Post Privacy Users Table
 */

async function up(db) {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS post_privacy_users (
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Add soft delete column to posts table
    ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
    
    -- Add indexes for faster privacy lookups
    CREATE INDEX IF NOT EXISTS idx_post_privacy_post_id ON post_privacy_users (post_id);
    CREATE INDEX IF NOT EXISTS idx_post_privacy_user_id ON post_privacy_users (user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts (deleted_at);
  `);
}

async function down(db) {
  return db.exec(`
    DROP INDEX IF EXISTS idx_posts_deleted_at;
    DROP INDEX IF EXISTS idx_post_privacy_user_id;
    DROP INDEX IF EXISTS idx_post_privacy_post_id;
    DROP TABLE IF EXISTS post_privacy_users;
    
    -- Remove soft delete column from posts
    PRAGMA foreign_keys=off;
    
    CREATE TABLE posts_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      privacy TEXT NOT NULL DEFAULT 'public',
      group_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
    );
    
    INSERT INTO posts_temp 
    SELECT id, user_id, content, image_url, privacy, group_id, created_at, updated_at
    FROM posts;
    
    DROP TABLE posts;
    
    ALTER TABLE posts_temp RENAME TO posts;
    
    PRAGMA foreign_keys=on;
  `);
}

// Use CommonJS exports for compatibility with require()
module.exports = { up, down };