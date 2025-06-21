"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquare,
  Heart,
  UserPlus,
  BellDot,
  CheckCircle,
  AlertCircle,
  Info,
  type LucideIcon,
  ThumbsUp,
} from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"
import type { Notification } from "@/app/notifications/actions"
import { markNotificationAsRead } from "@/app/notifications/actions"
import { useToast } from "@/hooks/use-toast"
import { useTransition } from "react"

interface NotificationItemProps {
  notification: Notification
  onNotificationRead?: (notificationId: string) => void // Callback to update parent state
}

const getNotificationIcon = (type: Notification["type"]): LucideIcon => {
  switch (type) {
    case "new_comment":
      return MessageSquare
    case "new_reply":
      return MessageSquare // Could be a different icon like CornerDownLeft
    case "post_liked": // Assuming you might add likes
      return Heart
    case "project_liked":
      return Heart
    case "new_follower": // Assuming you might add follows
      return UserPlus
    case "content_approved":
      return CheckCircle
    case "content_rejected":
      return AlertCircle
    case "mention":
      return BellDot // Or AtSign
    case "series_update":
      return Info
    case "achievement_unlocked":
      return ThumbsUp // Or Award
    case "system_message":
      return Info
    default:
      return BellDot
  }
}

const getNotificationMessage = (notification: Notification): string => {
  const actor = notification.actor_username || "Someone"
  switch (notification.type) {
    case "new_comment":
      return `${actor} commented on your post: "${notification.content_preview || "View comment"}"`
    case "new_reply":
      return `${actor} replied to your comment: "${notification.content_preview || "View reply"}"`
    case "post_liked":
      return `${actor} liked your post.`
    case "project_liked":
      return `${actor} liked your project.`
    case "new_follower":
      return `${actor} started following you.`
    case "content_approved":
      return `Your ${notification.entity_type || "content"} "${notification.content_preview || "item"}" has been approved.`
    case "content_rejected":
      return `Your ${notification.entity_type || "content"} "${notification.content_preview || "item"}" requires attention.`
    case "mention":
      return `${actor} mentioned you in a ${notification.entity_type || "comment"}: "${notification.content_preview || "View mention"}"`
    case "series_update":
      return `The series "${notification.content_preview || "a series"}" has a new post.`
    case "achievement_unlocked":
      return `You've unlocked a new achievement: "${notification.content_preview || "Great job!"}"`
    case "system_message":
      return notification.content_preview || "New system message."
    default:
      return "You have a new notification."
  }
}

export function NotificationItem({ notification, onNotificationRead }: NotificationItemProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const Icon = getNotificationIcon(notification.type)
  const message = getNotificationMessage(notification)

  const handleMarkAsRead = async () => {
    if (notification.is_read) return

    startTransition(async () => {
      const result = await markNotificationAsRead(notification.id)
      if (result.success) {
        if (onNotificationRead) {
          onNotificationRead(notification.id)
        }
        // Optionally, show a toast, but might be too noisy for individual reads
        // toast({ title: "Notification marked as read." });
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not mark notification as read.",
          variant: "destructive",
        })
      }
    })
  }

  const content = (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 hover:bg-neutral-800/70 rounded-md transition-colors",
        notification.is_read ? "opacity-70" : "bg-neutral-800/50",
      )}
      onClick={!notification.is_read ? handleMarkAsRead : undefined} // Mark as read on click if unread
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (!notification.is_read) handleMarkAsRead()
          // If there's a link, also navigate
          if (notification.link) window.location.href = notification.link
        }
      }}
    >
      <Avatar className="h-8 w-8 mt-1">
        {notification.actor_avatar_url ? (
          <AvatarImage
            src={notification.actor_avatar_url || "/placeholder.svg"}
            alt={notification.actor_username || "Actor"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-700">
            <Icon className="h-4 w-4 text-neutral-400" />
          </div>
        )}
        <AvatarFallback className="text-xs">
          {notification.actor_username
            ? notification.actor_username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : notification.type.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-neutral-200">{message}</p>
        <p className="text-xs text-neutral-400">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <div className="flex-shrink-0 self-center">
          <span className="block h-2.5 w-2.5 rounded-full bg-sky-500" title="Unread"></span>
        </div>
      )}
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} className="block focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md">
        {content}
      </Link>
    )
  }

  return content
}
