/**
 * Migration: Create Follows Table
 */

async function up(db) {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
      CHECK (follower_id != following_id)
    );

    -- Add indexes for faster lookups
    CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);
  `);
}

async function down(db) {
  return db.exec(`
    DROP INDEX IF EXISTS idx_follows_following_id;
    DROP INDEX IF EXISTS idx_follows_follower_id;
    DROP TABLE IF EXISTS follows;
  `);
}

// Use CommonJS exports for compatibility with require()
module.exports = { up, down };
