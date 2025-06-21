-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who performed the action
    action VARCHAR(255) NOT NULL, -- e.g., 'update_user_role', 'create_post', 'delete_comment'
    target_type VARCHAR(100), -- e.g., 'user', 'post', 'project', 'series', 'tag', 'comment'
    target_id TEXT, -- Can be UUID or string ID depending on the target
    details JSONB, -- For storing additional context, like old/new values
    ip_address INET, -- Optional: IP address of the user performing the action
    user_agent TEXT, -- Optional: User agent string
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for common query patterns
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target_type_target_id ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs:
-- Owners should be able to read all audit logs.
-- Admins might have more restricted read access or none, depending on requirements.
-- For now, only owners can read. No one can insert/update/delete directly except through server functions.

CREATE POLICY "Owners can read all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
  )
);

-- Note: Inserts into audit_logs will be handled by server-side functions with service_role key,
-- bypassing RLS for insertion. Direct client-side insertion should not be allowed.
