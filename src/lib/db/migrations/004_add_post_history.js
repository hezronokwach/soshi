/**
 * Migration: Add Post History Table
 */

async function up(db) {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS post_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      editor_id INTEGER NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (editor_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Index for faster history lookups
    CREATE INDEX IF NOT EXISTS idx_post_history_post_id ON post_history (post_id);
    CREATE INDEX IF NOT EXISTS idx_post_history_editor_id ON post_history (editor_id);
  `);
}

async function down(db) {
  return db.exec(`
    DROP INDEX IF EXISTS idx_post_history_editor_id;
    DROP INDEX IF EXISTS idx_post_history_post_id;
    DROP TABLE IF EXISTS post_history;
  `);
}

// Use CommonJS exports for compatibility with require()
module.exports = { up, down };