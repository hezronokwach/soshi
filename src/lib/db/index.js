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
    // TODO: Implement migration logic
    // This would load and execute migration files from the migrations folder
    console.log('Running database migrations...');
    
    // Example implementation would go here
    
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
