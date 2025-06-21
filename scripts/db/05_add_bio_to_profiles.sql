-- Add a 'bio' column to the 'profiles' table IF IT DOES NOT EXIST
DO $$
BEGIN
IF NOT EXISTS (
  SELECT 1
  FROM   information_schema.columns
  WHERE  table_schema = 'public'
  AND    table_name   = 'profiles'
  AND    column_name  = 'bio'
) THEN
  ALTER TABLE public.profiles ADD COLUMN bio TEXT;
END IF;
END $$;

-- Add a comment for the new column (this will run every time but is harmless)
COMMENT ON COLUMN public.profiles.bio IS 'A short biography or description provided by the user.';

-- Optional: You might want to update the RLS policies if you want fine-grained control
-- over who can see/update the bio. For now, we assume existing policies are sufficient
-- or that the bio is considered public information like other profile fields.
-- If you updated the "Users can update their own profile" policy to specify columns,
-- you'd need to add 'bio' to the list of updatable columns.
-- The "Users can view all profiles" or "Public can read specific profile fields"
-- will allow reading this new column if they select '*'. Our server action
-- `getPublicProfileByUsername` will be updated to explicitly select it.

-- Update the handle_updated_at trigger if it wasn't set to fire on ANY column update
-- (Usually, it's fine as is, but good to keep in mind)
-- The existing trigger on 'profiles_updated' should still work correctly.
