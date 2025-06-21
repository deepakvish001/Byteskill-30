"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/types"

type NotificationType = Database["public"]["Enums"]["notification_type_enum"]

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id?: string | null
  actor_username?: string | null // For display
  actor_avatar_url?: string | null // For display
  entity_id?: string | null
  entity_type?: string | null
  secondary_entity_id?: string | null
  secondary_entity_type?: string | null
  content_preview?: string | null
  link?: string | null
  is_read: boolean
  created_at: string
}

interface CreateNotificationPayload {
  userId: string
  type: NotificationType
  actorId?: string | null
  entityId?: string | null
  entityType?: string | null
  secondaryEntityId?: string | null
  secondaryEntityType?: string | null
  contentPreview?: string | null
  link?: string | null
}

export async function createInAppNotification(payload: CreateNotificationPayload): Promise<{
  success: boolean
  notification?: Notification
  error?: string
}> {
  const supabase = createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: "User not authenticated for creating notification." }
  }

  // Prevent users from creating notifications for others, unless it's a system process (not handled here)
  // Or if actorId is provided and it's the current user (e.g. mentioning someone)
  // For now, we assume this function is called server-side by trusted actions.

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: payload.userId,
      type: payload.type,
      actor_id: payload.actorId,
      entity_id: payload.entityId,
      entity_type: payload.entityType,
      secondary_entity_id: payload.secondaryEntityId,
      secondary_entity_type: payload.secondaryEntityType,
      content_preview: payload.contentPreview,
      link: payload.link,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating in-app notification:", error)
    return { success: false, error: error.message }
  }

  // Revalidate a path that might display notification counts, e.g., user-specific layout or header.
  // This is a bit broad; more targeted revalidation might be needed depending on UI.
  revalidatePath("/", "layout") // Revalidates the whole layout, might affect header

  return { success: true, notification: data as Notification }
}

export async function getNotificationsForUser(
  userId: string,
  limit = 10,
  page = 1,
): Promise<{ notifications: Notification[]; count: number; error?: string }> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from("notifications")
    .select(
      `
      id, user_id, type, actor_id, entity_id, entity_type, 
      secondary_entity_id, secondary_entity_type,
      content_preview, link, is_read, created_at,
      actor:profiles!actor_id (username, avatar_url)
    `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching notifications:", error)
    return { notifications: [], count: 0, error: error.message }
  }

  const transformedNotifications = data.map((n: any) => ({
    ...n,
    actor_username: n.actor?.username,
    actor_avatar_url: n.actor?.avatar_url,
  }))

  return { notifications: transformedNotifications as Notification[], count: count || 0 }
}

export async function getUnreadNotificationCountForUser(userId: string): Promise<{ count: number; error?: string }> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error fetching unread notification count:", error)
    return { count: 0, error: error.message }
  }
  return { count: count || 0 }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "User not authenticated." }

  // Check if the notification belongs to the current user before marking as read
  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("id, user_id")
    .eq("id", notificationId)
    .single()

  if (fetchError || !notification) {
    return { success: false, error: "Notification not found." }
  }
  if (notification.user_id !== user.id) {
    return { success: false, error: "Unauthorized to update this notification." }
  }

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }
  revalidatePath("/", "layout") // For header count
  // Potentially revalidate a dedicated notifications page if one exists
  // revalidatePath("/me/notifications")
  return { success: true }
}

export async function markAllNotificationsAsReadForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { success: false, error: "User not authenticated or unauthorized." }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }
  revalidatePath("/", "layout") // For header count
  // revalidatePath("/me/notifications")
  return { success: true }
}
