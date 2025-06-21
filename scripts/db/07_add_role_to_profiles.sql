ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- You can optionally add a comment to the column
COMMENT ON COLUMN public.profiles.role IS 'User role, e.g., user, admin, owner';

-- Ensure the handle_updated_at trigger still works correctly
-- (This is usually fine, but good to keep in mind if you had complex triggers)

-- Backfill existing users to 'user' if they somehow have NULL (though DEFAULT should handle new ones)
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
