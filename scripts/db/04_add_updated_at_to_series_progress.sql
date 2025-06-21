-- Add the updated_at column to the series_progress table if it doesn't already exist
-- It will default to the current time for new rows and for existing rows upon this ALTER.
ALTER TABLE public.series_progress
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create or replace the trigger function to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION public.handle_series_progress_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if read_posts_slugs actually changed to avoid unnecessary updates
  -- This is important if other columns might be updated without progress changing.
  IF OLD.read_posts_slugs IS DISTINCT FROM NEW.read_posts_slugs THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists to prevent duplication or conflicts
DROP TRIGGER IF EXISTS on_series_progress_updated_timestamp ON public.series_progress;

-- Create the trigger that fires BEFORE an UPDATE on the series_progress table
CREATE TRIGGER on_series_progress_updated_timestamp
BEFORE UPDATE ON public.series_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_series_progress_update_timestamp();

-- Note: For INSERT operations, the DEFAULT now() on the column definition handles setting the initial updated_at.
-- The trigger above specifically handles UPDATE operations.
