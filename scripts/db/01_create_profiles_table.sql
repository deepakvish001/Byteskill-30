-- 1. Ensure the 'profiles' table exists with the correct columns and constraints.
-- The 'id' column should be the primary key and a foreign key to auth.users.id.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  mobile_number TEXT,
  role TEXT DEFAULT 'user',
  comment_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Added from migration 12

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30) -- Increased max length for GitHub usernames
);

-- 2. Add comments to the table and columns for clarity.
COMMENT ON TABLE public.profiles IS 'Profile information for authenticated users.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase auth user id.';
COMMENT ON COLUMN public.profiles.username IS 'Publicly visible unique username.';
COMMENT ON COLUMN public.profiles.role IS 'User role, e.g., user, admin.';
COMMENT ON COLUMN public.profiles.mobile_number IS 'User''s mobile phone number.';
COMMENT ON COLUMN public.profiles.comment_notifications_enabled IS 'User preference to receive email notifications for new comments and replies.';


-- 3. Enable Row Level Security (RLS) for the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies:
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true); -- Or restrict as needed, e.g., to admins or based on relationships

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Function to automatically create a profile when a new user signs up in auth.users.
-- This function will create a basic profile. Our custom signup action will update it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Important: SECURITY DEFINER
AS $$
DECLARE
  generated_username TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Check if a profile already exists for this user ID
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  IF profile_exists THEN
    RETURN NEW; -- Profile already exists, do nothing
  END IF;

  -- Attempt to generate a username from GitHub's user_name, then email, then a generic one
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name', -- GitHub specific username
    NEW.raw_user_meta_data->>'preferred_username', -- OpenID Connect generic
    split_part(NEW.email, '@', 1)
  );

  -- Ensure username is unique, append random chars if not
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) THEN
    generated_username := generated_username || '_' || substr(md5(random()::text), 1, 4);
  END IF;
  -- Fallback if username is still null or empty (e.g. email was null)
  IF generated_username IS NULL OR generated_username = '' THEN
    generated_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  -- Ensure username length constraints
  generated_username := substr(generated_username, 1, 30);


  INSERT INTO public.profiles (id, username, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    generated_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', -- From custom claims or standard OAuth mapping
      NEW.raw_user_meta_data->>'name'       -- Common field from Google/GitHub
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url', -- Standard OAuth mapping
      NEW.raw_user_meta_data->>'picture'    -- Common field from Google
    ),
    NEW.email -- Store the email from auth.users table
  )
  ON CONFLICT (id) DO NOTHING; -- Should not happen due to the check above, but good for safety
  RETURN NEW;
END;
$$;

-- 6. Trigger to call handle_new_user on new user creation.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 7. Function and Trigger to update the 'updated_at' timestamp.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 8. Ensure created_at is set on insert if not provided
ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();

-- Initialize updated_at for existing rows if it's NULL
UPDATE public.profiles SET updated_at = created_at WHERE updated_at IS NULL;

-- Add bio column if it doesn't exist (from previous migration, ensure it's here)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Add email column to profiles table if it doesn't exist, to store the auth.users.email
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    COMMENT ON COLUMN public.profiles.email IS 'User''s email, synced from auth.users.';
  END IF;
END $$;

-- Update username length constraint if it exists, or add it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'profiles' AND constraint_name = 'username_length'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT username_length;
    END IF;
    ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30);
EXCEPTION
    WHEN undefined_object THEN
        ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30);
END
$$;
