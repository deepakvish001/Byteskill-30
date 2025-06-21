CREATE OR REPLACE FUNCTION increment_view_count(item_id_param UUID, item_type_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF item_type_param = 'post' THEN
    UPDATE posts
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW() -- Optionally update updated_at
    WHERE id = item_id_param;
  ELSIF item_type_param = 'project' THEN
    UPDATE projects
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW() -- Optionally update updated_at
    WHERE id = item_id_param;
  ELSE
    RAISE EXCEPTION 'Invalid item type: %', item_type_param;
  END IF;
END;
$$;

-- Grant execute permission to the authenticated role (or your specific app user role)
-- Replace 'authenticated' if you use a different role for your application access
GRANT EXECUTE ON FUNCTION increment_view_count(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID, TEXT) TO service_role; -- if called by server client with service_role
