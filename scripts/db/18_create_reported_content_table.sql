-- Enum for content types that can be reported
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reported_content_type_enum') THEN
        CREATE TYPE reported_content_type_enum AS ENUM (
            'comment',
            'post',
            'project',
            'user_profile'
            -- Add more as needed
        );
    END IF;
END$$;

-- Enum for report statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_enum') THEN
        CREATE TYPE report_status_enum AS ENUM (
            'pending_review',
            'under_review', -- Moderator has acknowledged it
            'resolved_no_action', -- Report reviewed, content deemed okay
            'resolved_action_taken', -- Report reviewed, action taken (e.g., content deleted, user warned)
            'resolved_duplicate' -- Report is a duplicate of an existing one
        );
    END IF;
END$$;

-- Table to store reported content
CREATE TABLE IF NOT EXISTS reported_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL, -- ID of the reported item (e.g., comment_id, post_id)
    content_type reported_content_type_enum NOT NULL,
    reason TEXT CHECK (char_length(reason) <= 1000), -- User-provided reason
    status report_status_enum NOT NULL DEFAULT 'pending_review',
    
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin/Moderator who handled the report
    moderator_notes TEXT CHECK (char_length(moderator_notes) <= 2000), -- Notes from the moderator
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Ensure a user can't report the exact same piece of content multiple times if it's still pending
    CONSTRAINT unique_pending_report UNIQUE (reporter_id, content_id, content_type, status) WHERE (status = 'pending_review')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reported_content_status ON reported_content(status);
CREATE INDEX IF NOT EXISTS idx_reported_content_content_type ON reported_content(content_type);
CREATE INDEX IF NOT EXISTS idx_reported_content_reporter_id ON reported_content(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reported_content_content_id_content_type ON reported_content(content_id, content_type);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE TRIGGER set_reported_content_updated_at
BEFORE UPDATE ON reported_content
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.set_current_timestamp_updated_at();

COMMENT ON TABLE reported_content IS 'Stores reports submitted by users for various content types.';
COMMENT ON COLUMN reported_content.reporter_id IS 'The user who submitted the report.';
COMMENT ON COLUMN reported_content.content_id IS 'The ID of the content being reported (e.g., a comment ID or post ID).';
COMMENT ON COLUMN reported_content.content_type IS 'The type of content being reported (e.g., comment, post).';
COMMENT ON COLUMN reported_content.reason IS 'The reason provided by the reporter.';
COMMENT ON COLUMN reported_content.status IS 'The current status of the report (e.g., pending, resolved).';
COMMENT ON COLUMN reported_content.moderator_id IS 'The moderator who handled the report.';
COMMENT ON COLUMN reported_content.moderator_notes IS 'Notes or actions taken by the moderator.';
