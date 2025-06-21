-- 06_add_mobile_number_to_profiles.sql
-- Adds the mobile_number column to public.profiles if it does not already exist.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

COMMENT ON COLUMN public.profiles.mobile_number IS 'User''s mobile phone number.';
