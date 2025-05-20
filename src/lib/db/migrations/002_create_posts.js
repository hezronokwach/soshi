/**
 * Migration: Create Posts Table
 */

async function up(db) {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
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
  `);
}

async function down(db) {
  return db.exec(`DROP TABLE IF EXISTS posts;`);
}

// Use CommonJS exports for compatibility with require()
module.exports = { up, down };
