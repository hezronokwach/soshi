CREATE TABLE IF NOT EXISTS group_post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    image_url TEXT,
    like_count INTEGER,
    dislike_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES group_post_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_post_comments_group_post_id ON group_post_comments(group_post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_user_id ON group_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_parent_id ON group_post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_created_at ON group_post_comments(created_at);

-- Table for group post comment reactions
CREATE TABLE IF NOT EXISTS group_post_comment_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    like_count INTEGER,
    dislike_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES group_post_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_post_comment_reactions_comment_id ON group_post_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comment_reactions_user_id ON group_post_comment_reactions(user_id);