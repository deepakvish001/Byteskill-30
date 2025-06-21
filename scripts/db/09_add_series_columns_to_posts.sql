-- Re-introduce series linkage columns required by the admin dashboard
-- Safe to run multiple times (IF NOT EXISTS guards)

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS series_id UUID
    REFERENCES series(id) ON DELETE SET NULL;

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS series_part_number INTEGER;

-- Helpful indexes for fast look-ups and sorting
CREATE INDEX IF NOT EXISTS idx_posts_series_id
    ON posts(series_id);

CREATE INDEX IF NOT EXISTS idx_posts_series_part_number
    ON posts(series_part_number);
