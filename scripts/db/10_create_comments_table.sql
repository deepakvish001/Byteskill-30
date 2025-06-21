-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
    is_approved BOOLEAN DEFAULT TRUE, -- Auto-approve for now, can be changed for moderation
    is_deleted BOOLEAN DEFAULT FALSE, -- For soft deletes by users or admins
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- RLS Policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users can view all approved, non-deleted comments
CREATE POLICY "Allow public read access to approved comments"
ON comments
FOR SELECT
USING (is_approved = TRUE AND is_deleted = FALSE);

-- Authenticated users can insert their own comments
CREATE POLICY "Allow authenticated users to insert comments"
ON comments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can update their own non-deleted comments (e.g., content, or soft delete)
CREATE POLICY "Allow users to update their own comments"
ON comments
FOR UPDATE
USING (auth.uid() = user_id AND is_deleted = FALSE)
WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own comments
-- This is covered by the update policy if we allow them to set is_deleted = TRUE.
-- If we want a specific delete policy for soft delete:
-- CREATE POLICY "Allow users to soft-delete their own comments"
-- ON comments
-- FOR UPDATE -- Or DELETE if you handle soft delete differently
-- USING (auth.uid() = user_id AND is_deleted = FALSE)
-- WITH CHECK (is_deleted = TRUE); -- This check might be redundant if handled in the update data

-- Admins/Owners can do anything (Supabase default for service_role key bypasses RLS)
-- If you need specific admin RLS for client-side admin operations:
-- CREATE POLICY "Allow admin full access"
-- ON comments
-- FOR ALL
-- USING (public.is_admin_or_owner(auth.uid())) -- Assuming you have such a function
-- WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_updated
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_comment_updated_at();
