-- Add reputation_score to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reputation_score INTEGER NOT NULL DEFAULT 0;

-- Create ENUM type for reputation event types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reputation_event_type_enum') THEN
        CREATE TYPE public.reputation_event_type_enum AS ENUM (
            -- Positive Actions
            'profile_completed_bio',
            'profile_completed_avatar',
            'post_published',
            'project_published',
            'comment_created',
            'comment_received_upvote', -- Placeholder for future upvote system
            'reply_received_upvote',   -- Placeholder for future upvote system
            'series_created',
            'helpful_report_submitted', -- If a report leads to action

            -- Negative Actions
            'comment_deleted_by_moderator',
            'post_deleted_by_moderator',
            'project_deleted_by_moderator',
            'report_abuse_by_user', -- If user spams reports

            -- Corrections/Manual Adjustments
            'manual_adjustment_positive',
            'manual_adjustment_negative'
        );
    END IF;
END$$;

-- Create reputation_events table
CREATE TABLE IF NOT EXISTS public.reputation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type public.reputation_event_type_enum NOT NULL,
    points_change INTEGER NOT NULL,
    related_content_id TEXT, -- e.g., comment_id, post_id, other_user_id (for report abuse)
    related_content_type TEXT, -- e.g., 'comment', 'post', 'user_profile'
    description TEXT, -- Optional: for manual adjustments or specific details
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT check_points_change_not_zero CHECK (points_change <> 0)
);

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON public.reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_event_type ON public.reputation_events(event_type);


-- Function to add reputation event and update score atomically
CREATE OR REPLACE FUNCTION public.add_reputation_event_and_update_score(
    p_user_id UUID,
    p_event_type public.reputation_event_type_enum,
    p_points_change INTEGER,
    p_related_content_id TEXT DEFAULT NULL,
    p_related_content_type TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Important for allowing updates from triggers or other contexts if needed
AS $$
BEGIN
    -- Insert into reputation_events
    INSERT INTO public.reputation_events (
        user_id,
        event_type,
        points_change,
        related_content_id,
        related_content_type,
        description
    ) VALUES (
        p_user_id,
        p_event_type,
        p_points_change,
        p_related_content_id,
        p_related_content_type,
        p_description
    );

    -- Update profiles table
    UPDATE public.profiles
    SET reputation_score = reputation_score + p_points_change
    WHERE id = p_user_id;

EXCEPTION
    WHEN others THEN
        -- Log the error or handle it as needed
        RAISE WARNING 'Error in add_reputation_event_and_update_score: %', SQLERRM;
        RAISE; -- Re-raise the exception to ensure transaction rollback if part of a larger one
END;
$$;

-- Example of how to grant execute permission if needed (e.g. if called by 'anon' or 'authenticated' roles directly)
-- For now, we'll assume it's called by server-side code with appropriate privileges.
-- GRANT EXECUTE ON FUNCTION public.add_reputation_event_and_update_score(UUID, public.reputation_event_type_enum, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON COLUMN public.profiles.reputation_score IS 'The overall reputation score for the user.';
COMMENT ON TABLE public.reputation_events IS 'Logs events that modify a user''s reputation score.';
COMMENT ON COLUMN public.reputation_events.event_type IS 'The type of event that triggered the reputation change.';
COMMENT ON COLUMN public.reputation_events.points_change IS 'The number of points added or subtracted for this event.';
COMMENT ON COLUMN public.reputation_events.related_content_id IS 'Identifier for content related to this reputation event (e.g., comment ID, post ID).';
COMMENT ON COLUMN public.reputation_events.related_content_type IS 'Type of content related to this event (e.g., ''comment'', ''post'').';
COMMENT ON FUNCTION public.add_reputation_event_and_update_score IS 'Atomically adds a reputation event and updates the user''s total reputation score.';

-- Initial data for profiles if reputation_score column was just added and is NULL
-- This ensures existing users have a non-NULL score.
-- Run this only if you are adding the column to an existing table with data.
-- UPDATE public.profiles SET reputation_score = 0 WHERE reputation_score IS NULL;
