CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL, -- 'post_created', 'post_liked', 'post_disliked', 'comment_created', 'comment_liked', 'comment_disliked'
    target_type TEXT NOT NULL,   -- 'post', 'comment'
    target_id INTEGER NOT NULL,  -- ID of the target (post_id or comment_id)
    target_user_id INTEGER,      -- User who owns the target (for reactions on others' content)
    metadata TEXT,               -- JSON metadata (post content preview, etc.)
    is_hidden BOOLEAN DEFAULT 0, -- Whether user has hidden this activity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Table to track user's activity privacy settings
CREATE TABLE IF NOT EXISTS user_activity_settings (
    user_id INTEGER PRIMARY KEY,
    show_posts BOOLEAN DEFAULT 1,
    show_comments BOOLEAN DEFAULT 1,
    show_likes BOOLEAN DEFAULT 1,
    show_to_followers_only BOOLEAN DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
