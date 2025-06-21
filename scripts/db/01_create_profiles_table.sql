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
bio TEXT, -- Added from previous migration
mobile_number TEXT, -- Added mobile_number
role TEXT DEFAULT 'user',

CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

-- 2. Add comments to the table and columns for clarity.
COMMENT ON TABLE public.profiles IS 'Profile information for authenticated users.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase auth user id.';
COMMENT ON COLUMN public.profiles.username IS 'Publicly visible unique username.';
COMMENT ON COLUMN public.profiles.role IS 'User role, e.g., user, admin.';
COMMENT ON COLUMN public.profiles.mobile_number IS 'User''s mobile phone number.';


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
USING (true);

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
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
INSERT INTO public.profiles (id, username, avatar_url, full_name)
VALUES (
NEW.id,
COALESCE(split_part(NEW.email, '@', 1), 'user_' || substr(NEW.id::text, 1, 8)), -- Default username
NEW.raw_user_meta_data->>'avatar_url',
NEW.raw_user_meta_data->>'full_name'
)
ON CONFLICT (id) DO NOTHING;
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
