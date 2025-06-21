import type { SupabaseClient } from "@supabase/supabase-js"

export type AuditAction =
  // User Management
  | "update_user_role"
  | "bulk_update_user_roles"
  // Posts
  | "create_post"
  | "update_post"
  | "delete_post"
  // Projects
  | "create_project"
  | "update_project"
  | "delete_project"
  // Series
  | "create_series"
  | "update_series"
  | "delete_series"
  | "update_series_posts"
  // Tags
  | "create_tag"
  | "update_tag"
  | "delete_tag"
  // Comments
  | "admin_approve_comment"
  | "admin_unapprove_comment"
  | "admin_toggle_comment_deletion"
  | "admin_edit_comment"
  | "admin_hard_delete_comment"
  // Moderation
  | "admin_update_report_status"
  // General Admin
  | "admin_login"
  | "admin_action_failed"

export type AuditTargetType = "user" | "post" | "project" | "series" | "tag" | "comment" | "system" | "report"

interface AuditLogDetails {
  targetId?: string | number // ID of the entity being acted upon
  targetType?: AuditTargetType
  changes?: Record<string, { oldValue?: any; newValue?: any }> // For tracking specific field changes
  reason?: string // Optional reason for the action
  [key: string]: any // Allow other arbitrary details
}

/**
 * Logs an administrative action.
 * This function should be called from server-side actions.
 * It uses the Supabase client passed to it, which should be a service_role client
 * if RLS prevents direct insert by the acting user.
 * However, for audit logs, it's often fine for the acting admin to insert their own log entry.
 */
export async function logAdminAction(
  supabase: SupabaseClient, // Pass the Supabase client instance
  actingUserId: string,
  action: AuditAction,
  details?: AuditLogDetails,
) {
  try {
    const logEntry = {
      user_id: actingUserId,
      action: action,
      target_type: details?.targetType,
      target_id: details?.targetId?.toString(),
      details: details ? JSON.parse(JSON.stringify(details)) : null, // Ensure details is a clean JSON object
      // ip_address and user_agent could be captured from request headers if available
    }

    const { error } = await supabase.from("audit_logs").insert(logEntry)

    if (error) {
      console.error("Failed to write audit log:", error.message, logEntry)
    }
  } catch (e: any) {
    console.error("Unexpected error writing audit log:", e.message)
  }
}
