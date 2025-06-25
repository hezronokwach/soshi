-- Drop indexes
DROP INDEX IF EXISTS idx_saved_posts_user_id;
DROP INDEX IF EXISTS idx_saved_posts_post_id;

-- Drop saved_posts table
DROP TABLE IF EXISTS saved_posts;
