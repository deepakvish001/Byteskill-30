-- Create table for bookmarks first
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- e.g., post slug or project slug
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'project', 'series')), -- Type of content being bookmarked
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_bookmark UNIQUE (user_id, item_id, item_type) -- Ensure a user can only bookmark an item once
);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'bookmarks' AND n.nspname = 'public' AND c.relrowsecurity
    ) THEN
        ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist, to prevent errors on re-run
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

-- RLS Policies
-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
ON public.bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON public.bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for performance (IF NOT EXISTS is good practice here too)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item_id_item_type ON public.bookmarks(item_id, item_type);

-- Optional: Add a comment to the table for clarity
COMMENT ON TABLE public.bookmarks IS 'Stores user bookmarks for various content types like posts, projects, or series.';
