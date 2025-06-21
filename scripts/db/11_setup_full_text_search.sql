-- 1. Add tsvector columns to posts and projects tables
ALTER TABLE posts ADD COLUMN fts tsvector;
ALTER TABLE projects ADD COLUMN fts tsvector;

-- 2. Create a function to update the tsvector column for posts
CREATE OR REPLACE FUNCTION public.update_post_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fts :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C'); -- Raw content might be noisy, consider stripping markdown/html
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to call the function when a post is inserted or updated
CREATE TRIGGER post_fts_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION public.update_post_fts();

-- 4. Create a function to update the tsvector column for projects
CREATE OR REPLACE FUNCTION public.update_project_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fts :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.long_description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'D'); -- Raw content might be noisy
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to call the function when a project is inserted or updated
CREATE TRIGGER project_fts_update
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION public.update_project_fts();

-- 6. Create GIN indexes on the tsvector columns for fast searching
CREATE INDEX posts_fts_idx ON posts USING GIN(fts);
CREATE INDEX projects_fts_idx ON projects USING GIN(fts);

-- 7. (Optional but Recommended) Populate existing rows
-- Run this once after creating the triggers and columns to populate FTS for existing data.
-- It might take time on large tables.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='fts') THEN
        UPDATE posts SET fts =         
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(content, '')), 'C')
        WHERE fts IS NULL; -- Only update if not already populated
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='fts') THEN
        UPDATE projects SET fts = 
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(long_description, '')), 'C') ||
            setweight(to_tsvector('english', coalesce(content, '')), 'D')
        WHERE fts IS NULL; -- Only update if not already populated
    END IF;
END $$;


-- 8. Create the search function
CREATE OR REPLACE FUNCTION public.search_content(search_term TEXT, result_limit INT DEFAULT 10)
RETURNS TABLE (
    id UUID,
    type TEXT,
    slug TEXT,
    title TEXT,
    snippet TEXT,
    published_at TIMESTAMPTZ,
    rank REAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    query_plain TEXT;
    query_web TEXT;
BEGIN
    -- Sanitize and prepare the search term for websearch_to_tsquery for better phrase matching and flexibility
    -- For plainto_tsquery, which is simpler: query_plain := plainto_tsquery('english', search_term);
    query_web := websearch_to_tsquery('english', search_term);

    RETURN QUERY
    WITH search_results AS (
        -- Search Posts
        SELECT
            p.id,
            'post' AS type,
            p.slug,
            p.title,
            ts_headline('english', coalesce(p.title, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.content, ''), query_web,
                        'StartSel=**,StopSel=**,MinWords=5,MaxWords=35,MaxFragments=3,FragmentDelimiter=...') AS snippet,
            p.published_at,
            ts_rank_cd(p.fts, query_web) AS rank
        FROM posts p
        WHERE p.status = 'published' AND p.fts @@ query_web

        UNION ALL

        -- Search Projects
        SELECT
            pr.id,
            'project' AS type,
            pr.slug,
            pr.title,
            ts_headline('english', coalesce(pr.title, '') || ' ' || coalesce(pr.description, '') || ' ' || coalesce(pr.long_description, ''), query_web,
                        'StartSel=**,StopSel=**,MinWords=5,MaxWords=35,MaxFragments=3,FragmentDelimiter=...') AS snippet,
            pr.published_at,
            ts_rank_cd(pr.fts, query_web) AS rank
        FROM projects pr
        WHERE pr.status = 'published' AND pr.fts @@ query_web
    )
    SELECT *
    FROM search_results
    ORDER BY rank DESC, published_at DESC
    LIMIT result_limit;
END;
$$;
