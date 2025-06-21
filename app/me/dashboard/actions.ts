"use server"

import { createClient } from "@/lib/supabase/server"
import { getPostBySlug, getAllSeries } from "@/lib/posts"
import { getProjectBySlug } from "@/lib/projects"
import type { PostFrontmatter, ProjectFrontmatter } from "@/lib/types"

export interface BookmarkedItem {
  id: string
  itemId: string
  itemType: "post" | "project"
  createdAt: string
  details: PostFrontmatter | ProjectFrontmatter | null
}

export interface EnrichedSeriesProgress {
  seriesSlug: string
  seriesTitle: string
  readPostsCount: number
  totalPostsCount: number
  isCompleted: boolean
  updatedAt: string // Added for sorting and display
}

export async function getBookmarkedItems(): Promise<{
  bookmarkedItems: BookmarkedItem[]
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
      .select("id, item_id, item_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError.message)
      return { bookmarkedItems: [], error: "Failed to fetch bookmarks." }
    }

    if (!bookmarks) {
      return { bookmarkedItems: [] }
    }

    const enrichedItems: BookmarkedItem[] = await Promise.all(
      bookmarks.map(async (bookmark) => {
        let details: PostFrontmatter | ProjectFrontmatter | null = null
        if (bookmark.item_type === "post") {
          details = await getPostBySlug(bookmark.item_id)
        } else if (bookmark.item_type === "project") {
          details = await getProjectBySlug(bookmark.item_id)
        }
        return {
          id: bookmark.id,
          itemId: bookmark.item_id,
          itemType: bookmark.item_type as "post" | "project",
          createdAt: bookmark.created_at,
          details: details,
        }
      }),
    )

    const validItems = enrichedItems.filter((item) => item.details !== null)
    return { bookmarkedItems: validItems }
  } catch (e: any) {
    console.error("Unexpected error fetching bookmarked items:", e.message)
    return { bookmarkedItems: [], error: "An unexpected error occurred." }
  }
}

export async function getSeriesProgressForUser(): Promise<{
  seriesProgress: EnrichedSeriesProgress[]
  error?: string
}> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { seriesProgress: [], error: "User not authenticated." }
  }

  try {
    const { data: progressRecords, error: progressError } = await supabase
      .from("series_progress")
      .select("series_slug, read_posts_slugs, updated_at") // Fetch updated_at
      .eq("user_id", user.id)

    if (progressError) {
      console.error("Error fetching series progress:", progressError.message)
      return { seriesProgress: [], error: "Failed to fetch series progress." }
    }

    if (!progressRecords || progressRecords.length === 0) {
      return { seriesProgress: [] }
    }

    const allSeriesInfo = getAllSeries()
    const seriesInfoMap = new Map(allSeriesInfo.map((s) => [s.slug, s]))

    const enrichedProgress = progressRecords
      .map((record) => {
        const seriesDetails = seriesInfoMap.get(record.series_slug)
        if (!seriesDetails) {
          return null
        }
        const readPostsCount = record.read_posts_slugs.length
        const totalPostsCount = seriesDetails.postCount
        return {
          seriesSlug: record.series_slug,
          seriesTitle: seriesDetails.title,
          readPostsCount: readPostsCount,
          totalPostsCount: totalPostsCount,
          isCompleted: readPostsCount >= totalPostsCount,
          updatedAt: record.updated_at, // Assign fetched updated_at
        }
      })
      .filter((p): p is EnrichedSeriesProgress => p !== null)
      .sort((a, b) => {
        // Sort by completion status first (incomplete before complete)
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1
        }
        // Then sort by most recently updated (descending)
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
        if (dateB !== dateA) {
          return dateB - dateA
        }
        // As a final tie-breaker, sort by title
        return a.seriesTitle.localeCompare(b.seriesTitle)
      })

    return { seriesProgress: enrichedProgress }
  } catch (e: any) {
    console.error("Unexpected error fetching series progress:", e.message)
    return { seriesProgress: [], error: "An unexpected error occurred." }
  }
}
