-- Create notification_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE notification_type_enum AS ENUM (
            'new_comment_on_post',  -- Someone commented on your post
            'new_reply_to_comment', -- Someone replied to your comment
            'post_mention',         -- You were mentioned in a post
            'comment_mention',      -- You were mentioned in a comment
            'new_follower',         -- Someone followed you (future feature)
            'content_approved',     -- Your submitted content was approved (future feature)
            'system_announcement'   -- General system announcements
            -- Add more types as needed
        );
    END IF;
END$$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- The recipient of the notification
    type notification_type_enum NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- User who performed the action (optional, e.g., system messages might not have an actor)
    
    -- Related entity information
    entity_id UUID, -- ID of the primary entity (e.g., comment_id for new_reply, post_id for new_comment_on_post)
    entity_type TEXT, -- e.g., 'comment', 'post', 'user'
    
    -- Optional secondary entity for context (e.g., for a 'new_comment_on_post', entity_id is the comment, secondary_entity_id is the post)
    secondary_entity_id UUID, 
    secondary_entity_type TEXT,

    content_preview TEXT, -- A short preview or summary of the notification content
    link TEXT, -- URL to navigate to when notification is clicked (e.g., link to the comment or post)
    
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT check_entity_type CHECK (entity_type IN ('post', 'comment', 'user', 'series', NULL)),
    CONSTRAINT check_secondary_entity_type CHECK (secondary_entity_type IN ('post', 'comment', 'user', 'series', NULL))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity_id_entity_type ON notifications(entity_id, entity_type);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users cannot update notifications directly (except through specific functions/actions)"
ON notifications
FOR UPDATE
USING (FALSE); -- Disallow direct updates, manage through server actions

CREATE POLICY "Users cannot delete notifications directly"
ON notifications
FOR DELETE
USING (FALSE); -- Disallow direct deletes

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMENT ON TABLE notifications IS 'Stores notifications for users.';
COMMENT ON COLUMN notifications.user_id IS 'The recipient of the notification.';
COMMENT ON COLUMN notifications.type IS 'Type of the notification, e.g., new_comment, new_reply.';
COMMENT ON COLUMN notifications.actor_id IS 'User who performed the action causing the notification.';
COMMENT ON COLUMN notifications.entity_id IS 'ID of the primary entity related to the notification (e.g., comment ID).';
COMMENT ON COLUMN notifications.entity_type IS 'Type of the primary entity (e.g., ''comment'', ''post'').';
COMMENT ON COLUMN notifications.secondary_entity_id IS 'ID of a secondary related entity for context (e.g., post ID for a new comment).';
COMMENT ON COLUMN notifications.secondary_entity_type IS 'Type of the secondary entity.';
COMMENT ON COLUMN notifications.content_preview IS 'A short preview text for the notification.';
COMMENT ON COLUMN notifications.link IS 'Direct link to the relevant content.';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read the notification.';
