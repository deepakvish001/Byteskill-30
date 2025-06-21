-- Add a column to the profiles table to store user notification preferences
ALTER TABLE public.profiles
ADD COLUMN
  comment_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.comment_notifications_enabled IS 'User preference to receive email notifications for new comments and replies.';
