export async function up(db) {
  // Create comments table
  await db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES comments(id)
    );

    -- Create indexes for better query performance
    CREATE INDEX idx_comments_post_id ON comments(post_id);
    CREATE INDEX idx_comments_user_id ON comments(user_id);
    CREATE INDEX idx_comments_parent_id ON comments(parent_id);
    CREATE INDEX idx_comments_created_at ON comments(created_at);

    -- Create comment reactions table
    CREATE TABLE comment_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('like', 'dislike', 'emoji')),
      emoji TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(comment_id, user_id, type)
    );

    -- Create indexes for comment reactions
    CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
    CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);
  `);
}

export async function down(db) {
  await db.exec(`
    DROP TABLE IF EXISTS comment_reactions;
    DROP TABLE IF EXISTS comments;
  `);
}