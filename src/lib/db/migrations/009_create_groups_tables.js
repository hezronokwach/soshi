// src/lib/db/migrations/009_create_groups_tables.js

const createGroupsTables = `
-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted')) DEFAULT 'pending',
    invited_by INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(group_id, user_id)
);

-- Group posts table
CREATE TABLE IF NOT EXISTS group_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_path VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group events table
CREATE TABLE IF NOT EXISTS group_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event responses table
CREATE TABLE IF NOT EXISTS event_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    response TEXT CHECK(response IN ('going', 'not_going')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES group_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- Notifications table (if not exists) - extend existing notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_event_responses_event_id ON event_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
`;

/**
 * Run the migration
 * @param {Database} db - Database instance
 */
async function up(db) {
    console.log('Creating groups tables...');

    // Check if we're using better-sqlite3 or sqlite
    if (db.exec) {
        // better-sqlite3 style
        db.exec(createGroupsTables);
    } else {
        // sqlite style
        await db.exec(createGroupsTables);
    }

    console.log('Groups tables created successfully');
}

/**
 * Rollback the migration
 * @param {Database} db - Database instance  
 */
async function down(db) {
    const dropTables = `
    DROP INDEX IF EXISTS idx_notifications_user_id;
    DROP INDEX IF EXISTS idx_event_responses_event_id;
    DROP INDEX IF EXISTS idx_group_events_group_id;
    DROP INDEX IF EXISTS idx_group_posts_group_id;
    DROP INDEX IF EXISTS idx_group_members_user_id;
    DROP INDEX IF EXISTS idx_group_members_group_id;
    
    DROP TABLE IF EXISTS event_responses;
    DROP TABLE IF EXISTS group_events;
    DROP TABLE IF EXISTS group_posts;
    DROP TABLE IF EXISTS group_members;
    DROP TABLE IF EXISTS groups;
  `;

    if (db.exec) {
        db.exec(dropTables);
    } else {
        await db.exec(dropTables);
    }

    console.log('Groups tables dropped successfully');
}

module.exports = { up, down };