// SQLite database configuration
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

/**
 * Get the database connection
 * @returns {Database} The database connection
 */
export function getDb() {
  if (!db) {
    db = new Database('soshi.db', { verbose: process.env.NODE_ENV === 'development' ? console.log : null });
    runMigrations();
  }
  return db;
}

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get applied migrations
    const appliedMigrations = db.prepare('SELECT name FROM migrations').all();
    const appliedMigrationNames = appliedMigrations.map(m => m.name);

    // Get migration files
    const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Sort to ensure migrations run in order

    // Run migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`);

        // Import migration file
        const migration = require(path.join(migrationsDir, file));

        // Run migration
        await migration.up(db);

        // Record migration
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);

        console.log(`Migration applied: ${file}`);
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

export default getDb;
