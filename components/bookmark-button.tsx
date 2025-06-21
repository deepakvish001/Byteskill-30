"use client"

import type React from "react"
import { useState, useTransition, useEffect, type HTMLAttributes } from "react"
import { Bookmark, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { BookmarkItemType } from "@/lib/types"
import { toggleBookmark, getBookmarkStatus } from "@/app/bookmarks/actions"
import { Button } from "@/components/ui/button"
import { useUser } from "@/app/contexts/UserContext"

interface BookmarkButtonProps extends HTMLAttributes<HTMLButtonElement> {
  itemId: string
  itemType: BookmarkItemType
  initialIsBookmarked?: boolean // Optional: if status is pre-fetched by parent
  size?: "sm" | "default" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost" | "secondary" | "link"
  onToggleSuccess?: (itemId: string, itemType: BookmarkItemType, newIsBookmarked: boolean) => void
}

export function BookmarkButton({
  itemId,
  itemType,
  className,
  initialIsBookmarked, // Use this if provided
  size = "icon",
  variant = "ghost",
  onToggleSuccess,
  ...props
}: BookmarkButtonProps) {
  const { user, isLoading: isUserLoading } = useUser() // Get user loading state
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked ?? false)
  // Separate loading state for the bookmark status itself
  const [isBookmarkStatusLoading, setIsBookmarkStatusLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Only fetch status if user is loaded and initialIsBookmarked was not provided
    if (!isUserLoading && user && typeof initialIsBookmarked === "undefined") {
      setIsBookmarkStatusLoading(true)
      getBookmarkStatus(itemId, itemType).then((status) => {
        if (!status.error) {
          setIsBookmarked(status.isBookmarked)
        } else if (status.error !== "rate_limited") {
          // Don't toast for rate limits
          // console.error("Failed to fetch initial bookmark status:", status.error);
          // toast.error("Could not load bookmark status."); // Optional: too noisy?
        }
        setIsBookmarkStatusLoading(false)
      })
    } else if (typeof initialIsBookmarked !== "undefined") {
      // If initialIsBookmarked is provided, use it and don't fetch.
      setIsBookmarked(initialIsBookmarked)
      setIsBookmarkStatusLoading(false)
    } else if (isUserLoading) {
      // If user is loading, bookmark status is also effectively loading
      setIsBookmarkStatusLoading(true)
    } else {
      // No user, or initialIsBookmarked provided
      setIsBookmarkStatusLoading(false)
      if (!user) setIsBookmarked(false) // Ensure it's false if no user
    }
  }, [itemId, itemType, user, isUserLoading, initialIsBookmarked])

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUserLoading || !user) {
      toast.error("You must be logged in to bookmark items.")
      return
    }

    if (isBookmarkStatusLoading || isPending) return

    startTransition(async () => {
      const previousIsBookmarked = isBookmarked
      const newBookmarkState = !isBookmarked
      setIsBookmarked(newBookmarkState) // Optimistic update

      const result = await toggleBookmark(itemId, itemType, previousIsBookmarked)

      if (result.success && typeof result.isBookmarked === "boolean") {
        setIsBookmarked(result.isBookmarked)
        toast.success(
          result.isBookmarked
            ? `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} bookmarked!`
            : `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} bookmark removed.`,
        )
        if (onToggleSuccess) {
          onToggleSuccess(itemId, itemType, result.isBookmarked)
        }
      } else {
        setIsBookmarked(previousIsBookmarked) // Revert
        toast.error(result.error || "Failed to update bookmark.")
      }
    })
  }

  // If user context is still loading, or no user and not trying to show a disabled state
  if (isUserLoading && typeof initialIsBookmarked === "undefined") {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("rounded-full p-2 animate-pulse", className)}
        aria-label="Loading user data"
        {...props}
      >
        <Bookmark className="h-5 w-5 text-neutral-500" />
      </Button>
    )
  }

  if (!user) {
    // Optionally, show a disabled button or null
    // For now, returning null if no user, to match previous behavior.
    // If you want to show a disabled button that prompts login:
    // return (
    //   <Button variant={variant} size={size} disabled className={cn("rounded-full p-2", className)} title="Login to bookmark" {...props}>
    //     <Bookmark className="h-5 w-5 text-neutral-400" />
    //   </Button>
    // );
    return null
  }

  // If fetching bookmark status specifically (after user is loaded)
  if (isBookmarkStatusLoading && typeof initialIsBookmarked === "undefined") {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("rounded-full p-2 animate-pulse", className)}
        aria-label="Loading bookmark status"
        {...props}
      >
        <Bookmark className="h-5 w-5 text-neutral-400" />
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending || isBookmarkStatusLoading} // Disable if bookmark status is still loading too
      className={cn(
        "rounded-full p-2 transition-colors",
        isBookmarked && !isPending
          ? "text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-500"
          : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
        className,
      )}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      {...props}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Bookmark
          className={cn("h-5 w-5 transition-transform duration-200 ease-in-out", {
            "fill-current": isBookmarked,
            "group-hover:scale-110": !isPending,
          })}
        />
      )}
      <span className="sr-only">{isBookmarked ? "Remove bookmark" : "Add bookmark"}</span>
    </Button>
  )
}
