/**
 * Migration: Create Sessions Table
 */

export async function up(db) {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    
    -- Index for faster session lookups
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
  `);
}

export async function down(db) {
  return db.exec(`
    DROP INDEX IF EXISTS idx_sessions_user_id;
    DROP INDEX IF EXISTS idx_sessions_token;
    DROP TABLE IF EXISTS sessions;
  `);
}
