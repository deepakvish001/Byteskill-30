-- Drop existing tables if they exist to ensure a clean slate for this version
DROP TABLE IF EXISTS series_posts CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS project_tags CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Create Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Posts Table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    content TEXT, -- Markdown or HTML content
    hero_image_url TEXT,
    thumbnail_image_url TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')), -- draft, published, archived
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    featured BOOLEAN DEFAULT FALSE
);

-- Create Post_Tags Junction Table (Many-to-Many for Posts and Tags)
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Create Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    long_description TEXT,
    content TEXT, -- Markdown or HTML content
    hero_image_url TEXT,
    thumbnail_image_url TEXT,
    live_url TEXT,
    repo_url TEXT,
    demo_url TEXT,
    technologies TEXT[], -- Array of strings
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    featured BOOLEAN DEFAULT FALSE,
    category VARCHAR(100)
);

-- Create Project_Tags Junction Table (Many-to-Many for Projects and Tags)
CREATE TABLE project_tags (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

-- Create Series Table
CREATE TABLE series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    hero_image_url TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Series_Posts Junction Table (Many-to-Many for Series and Posts, with ordering)
CREATE TABLE series_posts (
    series_id UUID REFERENCES series(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    part_number INTEGER NOT NULL,
    PRIMARY KEY (series_id, post_id),
    UNIQUE (series_id, part_number) -- Ensures part numbers are unique within a series
);

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for 'updated_at'
CREATE TRIGGER set_posts_timestamp
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_projects_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_series_timestamp
BEFORE UPDATE ON series
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Indexes for performance
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author_id ON posts(author_id);

CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_author_id ON projects(author_id);

CREATE INDEX idx_series_slug ON series(slug);
CREATE INDEX idx_series_status ON series(status);
CREATE INDEX idx_series_author_id ON series(author_id);

CREATE INDEX idx_tags_slug ON tags(slug);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag_id ON project_tags(tag_id);

CREATE INDEX idx_series_posts_series_id ON series_posts(series_id);
CREATE INDEX idx_series_posts_post_id ON series_posts(post_id);

-- Add author_username to posts and projects for easier display if needed, can be denormalized or joined
-- ALTER TABLE posts ADD COLUMN author_username VARCHAR(255);
-- ALTER TABLE projects ADD COLUMN author_username VARCHAR(255);
-- This would require triggers or application logic to keep in sync if profiles.username changes.
-- For now, we'll rely on joining with profiles table.

-- Add series_id and series_part_number to posts table directly
-- This simplifies querying for posts within a series and their order.
ALTER TABLE posts ADD COLUMN series_id UUID REFERENCES series(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN series_part_number INTEGER;
-- Add a unique constraint for series_id and series_part_number if a post can only be in one series at a specific part.
-- Or handle this uniqueness at the application level if a post could potentially be part of multiple series (less common).
-- For now, assuming a post is part of at most one series.
-- If using series_posts junction table, these columns might be redundant or serve different purposes.
-- Let's keep them for now as it's a common pattern. If series_posts is the sole source of truth for series membership, these can be removed.
-- Given series_posts table, these direct columns on 'posts' are indeed redundant for series membership.
-- Removing them to rely on series_posts junction table.
ALTER TABLE posts DROP COLUMN IF EXISTS series_id;
ALTER TABLE posts DROP COLUMN IF EXISTS series_part_number;


-- Re-confirming the series_posts table for clarity on post-series relationship
-- series_posts table correctly defines the many-to-many relationship and order.

-- Ensure profiles table has an email column if it's missing and needed for UserList display
-- This should have been handled by previous migrations, but as a safeguard:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT UNIQUE;
        RAISE NOTICE 'Column email added to profiles table.';
    ELSE
        RAISE NOTICE 'Column email already exists in profiles table.';
    END IF;
END $$;

-- Add a created_at to profiles if it's missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Column created_at added to profiles table.';
    ELSE
        RAISE NOTICE 'Column created_at already exists in profiles table.';
    END IF;
END $$;


-- Add an updated_at to profiles if it's missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        
        -- Trigger for 'updated_at' on profiles
        CREATE TRIGGER set_profiles_timestamp
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();

        RAISE NOTICE 'Column updated_at and its trigger added to profiles table.';
    ELSE
        RAISE NOTICE 'Column updated_at already exists in profiles table.';
    END IF;
END $$;


COMMENT ON COLUMN posts.status IS 'Possible values: draft, published, archived';
COMMENT ON COLUMN projects.status IS 'Possible values: draft, published, archived';
COMMENT ON COLUMN series.status IS 'Possible values: draft, published';

-- Seed some initial tags (optional)
-- INSERT INTO tags (name, slug) VALUES ('Technology', 'technology'), ('Programming', 'programming'), ('Web Development', 'web-development') ON CONFLICT (slug) DO NOTHING;

SELECT 'Content tables migration v2 complete.' AS result;
