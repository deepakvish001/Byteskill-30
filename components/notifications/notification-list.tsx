"use client"

import { useEffect, useState, useTransition } from "react"
import {
  getNotificationsForUser,
  markAllNotificationsAsReadForUser,
  type Notification,
} from "@/app/notifications/actions"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Inbox } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationListProps {
  userId: string
  initialNotifications?: Notification[]
  initialUnreadCount?: number
  onAllRead?: () => void // Callback when all are marked as read
  onNotificationRead?: (notificationId: string) => void // Callback when a single notification is read
}

export function NotificationList({
  userId,
  initialNotifications = [],
  initialUnreadCount = 0,
  onAllRead,
  onNotificationRead,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isLoading, setIsLoading] = useState(initialNotifications.length === 0) // Only load if no initial data
  const [isMarkingAllRead, startMarkAllReadTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch notifications if not provided initially or if userId changes
    // For this component, we assume initialNotifications are fresh enough for the popover.
    // A full page might fetch on mount.
    if (initialNotifications.length === 0 && userId) {
      setIsLoading(true)
      getNotificationsForUser(userId, 10) // Fetch recent 10 for popover
        .then((data) => {
          if (data.notifications) {
            setNotifications(data.notifications)
          } else if (data.error) {
            toast({ title: "Error", description: "Could not fetch notifications.", variant: "destructive" })
          }
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [userId, initialNotifications.length, toast])

  const handleMarkAllAsRead = () => {
    startMarkAllReadTransition(async () => {
      const result = await markAllNotificationsAsReadForUser(userId)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        if (onAllRead) onAllRead()
        toast({ title: "All notifications marked as read." })
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not mark all notifications as read.",
          variant: "destructive",
        })
      }
    })
  }

  const handleSingleNotificationRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    if (onNotificationRead) {
      onNotificationRead(notificationId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 h-40">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-40">
        <Inbox className="h-10 w-10 text-neutral-500 mb-2" />
        <p className="text-sm text-neutral-400">You have no new notifications.</p>
      </div>
    )
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div className="w-[350px] md:w-[400px]">
      <div className="flex justify-between items-center p-3 border-b border-neutral-700">
        <h4 className="font-semibold text-neutral-100">Notifications</h4>
        {hasUnread && (
          <Button
            variant="link"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="text-sky-400 hover:text-sky-300 px-0"
          >
            {isMarkingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark all as read"}
          </Button>
        )}
      </div>
      <ScrollArea className="h-[300px] md:h-[350px]">
        <div className="p-1">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNotificationRead={handleSingleNotificationRead}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 text-center border-t border-neutral-700">
        <Button variant="link" size="sm" asChild className="text-sky-400 hover:text-sky-300">
          {/* Link to a dedicated notifications page if you plan to have one */}
          {/* <Link href="/me/notifications">View all notifications</Link> */}
          <span className="text-xs text-neutral-500">More features coming soon</span>
        </Button>
      </div>
    </div>
  )
}
