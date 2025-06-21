-- Add view_count to posts table
ALTER TABLE posts
ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Add view_count to projects table
ALTER TABLE projects
ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Optionally, create indexes if you anticipate querying by view_count frequently for "popular" lists
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_view_count ON projects(view_count DESC);

-- Update existing content to have updated_at reflect this change
UPDATE posts SET updated_at = NOW() WHERE view_count = 0;
UPDATE projects SET updated_at = NOW() WHERE view_count = 0;

COMMENT ON COLUMN posts.view_count IS 'Number of times the post has been viewed.';
COMMENT ON COLUMN projects.view_count IS 'Number of times the project has been viewed.';
