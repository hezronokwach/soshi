// Database connection and utilities
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Database singleton to prevent multiple connections
let db = null;

/**
 * Initialize the database connection
 */
export async function initializeDatabase() {
  if (db) return db;

  try {
    // Open the database
    db = await open({
      filename: path.join(process.cwd(), 'soshi.db'),
      driver: sqlite3.Database
    });

    console.log('Database connection established');

    // Run migrations
    await runMigrations();

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Create migrations table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get applied migrations
    const appliedMigrations = await db.all('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(m => m.name);

    // Import migrations directly - Next.js doesn't support dynamic imports with variable paths
    // We'll import all migrations and run them in order

    // Import migration modules
    const migrations = [
      require('./migrations/001_create_users'),
      require('./migrations/002_create_posts'),
      require('./migrations/003_create_sessions'),
      require('./migrations/004_add_post_history'),
      require('./migrations/005_add_post_privacy_users'),
      require('./migrations/006_add_post_reactions'),
      require('./migrations/007_create_comments'),
      require('./migrations/008_create_follows_table')
    ];

    // Migration file names (must match the order above)
    const migrationNames = [
      '001_create_users.js',
      '002_create_posts.js',
      '003_create_sessions.js',
      '004_add_post_history.js',
      '005_add_post_privacy_users.js',
      '006_add_post_reactions.js',
      '007_create_comments.js',
      '008_create_follows_table.js'
    ];

    // Run migrations that haven't been applied yet
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      const fileName = migrationNames[i];

      if (!appliedMigrationNames.includes(fileName)) {
        console.log(`Applying migration: ${fileName}`);

        // Run migration
        await migration.up(db);

        // Record migration
        await db.run('INSERT INTO migrations (name) VALUES (?)', [fileName]);

        console.log(`Migration applied: ${fileName}`);
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export async function getDb() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('Database connection closed');
  }
}
