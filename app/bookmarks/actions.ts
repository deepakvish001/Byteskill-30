"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { BookmarkItemType, PostFrontmatter, ProjectFrontmatter, CardData } from "@/lib/types"
import { getAllPosts } from "@/lib/posts" // Assuming these exist and work
import { getAllProjects } from "@/lib/projects" // Assuming these exist and work

// Helper ─ recognise 429 "Too Many Requests" responses from Supabase / fetch
function isRateLimitError(err: any): boolean {
  if (!err) return false
  return (
    err?.status === 429 ||
    err?.code === "429" ||
    (typeof err?.message === "string" && err.message.toLowerCase().includes("too many"))
  )
}

export async function toggleBookmark(
  itemId: string,
  itemType: BookmarkItemType,
  isCurrentlyBookmarked: boolean,
): Promise<{ success: boolean; error?: string; isBookmarked?: boolean }> {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error fetching user or user not authenticated:", userError?.message)
    return { success: false, error: "User not authenticated." }
  }

  const userId = user.id

  try {
    if (isCurrentlyBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .match({ item_id: itemId, item_type: itemType, user_id: userId })

      if (error) {
        console.error("Error removing bookmark:", error.message)
        return { success: false, error: "Failed to remove bookmark." }
      }
      console.log(`[BookmarkAction] Removed bookmark for ${itemType} ${itemId} by user ${userId}`)
      revalidatePath("/")
      revalidatePath(`/${itemType === "post" ? "blog" : itemType}s`)
      revalidatePath(`/${itemType === "post" ? "blog" : itemType}s/${itemId}`)
      revalidatePath(`/me/profile`)
      revalidatePath(`/me/bookmarks`) // Revalidate bookmarks page
      return { success: true, isBookmarked: false }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from("bookmarks")
        .insert({ item_id: itemId, item_type: itemType, user_id: userId })

      if (error) {
        if (error.code === "23505") {
          console.warn(`[BookmarkAction] Bookmark already exists for ${itemType} ${itemId} by user ${userId}`)
          return { success: true, isBookmarked: true }
        }
        console.error("Error adding bookmark:", error.message)
        return { success: false, error: "Failed to add bookmark." }
      }
      console.log(`[BookmarkAction] Added bookmark for ${itemType} ${itemId} by user ${userId}`)
      revalidatePath("/")
      revalidatePath(`/${itemType === "post" ? "blog" : itemType}s`)
      revalidatePath(`/${itemType === "post" ? "blog" : itemType}s/${itemId}`)
      revalidatePath(`/me/profile`)
      revalidatePath(`/me/bookmarks`) // Revalidate bookmarks page
      return { success: true, isBookmarked: true }
    }
  } catch (e: any) {
    console.error("Unexpected error toggling bookmark:", e.message)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function getBookmarkStatus(
  itemId: string,
  itemType: BookmarkItemType,
): Promise<{ isBookmarked: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isBookmarked: false }
  }

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("item_id", itemId)
      .eq("item_type", itemType)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      if (isRateLimitError(error)) {
        console.warn(
          `[BookmarkAction] Rate-limited while checking bookmark status for ${itemType} ${itemId}. Returning false.`,
        )
        return { isBookmarked: false, error: "rate_limited" }
      }
      console.error("Error fetching bookmark status:", error.message)
      return { isBookmarked: false, error: "Failed to fetch bookmark status." }
    }

    return { isBookmarked: !!data }
  } catch (e: any) {
    if (isRateLimitError(e)) {
      console.warn(
        `[BookmarkAction] Rate-limited (caught) while checking bookmark status for ${itemType} ${itemId}. Returning false.`,
      )
      return { isBookmarked: false, error: "rate_limited" }
    }
    console.error("Unexpected error fetching bookmark status:", e?.message)
    return { isBookmarked: false, error: "An unexpected error occurred." }
  }
}

interface BookmarkRecord {
  id: string
  user_id: string
  item_id: string
  item_type: BookmarkItemType
  created_at: string
}

export async function getSavedBookmarks(): Promise<{
  bookmarkedItems: CardData[]
  error?: string
}> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { bookmarkedItems: [], error: "User not authenticated." }
  }

  try {
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("item_id, item_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError.message)
      return { bookmarkedItems: [], error: "Failed to fetch bookmarks." }
    }

    if (!bookmarks || bookmarks.length === 0) {
      return { bookmarkedItems: [] }
    }

    // Fetch all posts and projects once to avoid multiple file reads
    const allPosts = await getAllPosts()
    const allProjects = await getAllProjects()

    const enrichedBookmarks: CardData[] = bookmarks
      .map((bookmark: Omit<BookmarkRecord, "id" | "user_id">) => {
        let itemData: PostFrontmatter | ProjectFrontmatter | undefined | null
        let cardHref = "/"

        if (bookmark.item_type === "post") {
          itemData = allPosts.find((p) => p.slug === bookmark.item_id)
          cardHref = `/blog/${bookmark.item_id}`
        } else if (bookmark.item_type === "project") {
          itemData = allProjects.find((p) => p.slug === bookmark.item_id)
          cardHref = `/projects/${bookmark.item_id}`
        }
        // Add 'series' type if you implement series bookmarking

        if (itemData) {
          return {
            slug: itemData.slug,
            title: itemData.title,
            date: itemData.date, // Or bookmark.created_at for bookmark date
            tags: itemData.tags,
            description: itemData.description,
            imageUrl: itemData.thumbnailImage || itemData.heroImage,
            blurDataURL: itemData.thumbnailBlurDataURL || itemData.heroBlurDataURL,
            category: itemData.category,
            readTime: (itemData as PostFrontmatter).readTime, // Type assertion for readTime
            href: cardHref,
            itemType: bookmark.item_type, // Add itemType for filtering/sorting in UI
            bookmarkedAt: bookmark.created_at, // Add bookmark date
          } as CardData & { itemType: BookmarkItemType; bookmarkedAt: string } // Extend CardData for this context
        }
        return null
      })
      .filter((item): item is CardData & { itemType: BookmarkItemType; bookmarkedAt: string } => item !== null)
      // Sort by bookmark date, most recent first
      .sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime())

    return { bookmarkedItems: enrichedBookmarks }
  } catch (e: any) {
    console.error("Unexpected error fetching saved bookmarks:", e.message)
    return { bookmarkedItems: [], error: "An unexpected error occurred." }
  }
}
