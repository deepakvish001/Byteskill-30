import { createClient } from "@/lib/supabase/server"
import type { SeriesListingInfo, PostFrontmatter, DbSeries as DbSeriesType } from "./types"
import { cache } from "react"

// Helper to convert DbPost to PostFrontmatter (simplified for series context if needed)
function dbPostToPostFrontmatterForSeries(post: any): PostFrontmatter {
  return {
    slug: post.slug,
    title: post.title,
    date: post.published_at || post.created_at,
    tags: post.tags?.map((t: any) => t.slug) || [],
    originalTags: post.tags?.map((t: any) => t.name) || [],
    description: post.description || "",
    isPublished: post.status === "published",
    featured: post.featured || false,
    heroImage: post.hero_image_url,
    thumbnailImage: post.thumbnail_image_url,
    series_part_number: post.series_part_number, // Keep part number
    series:
      post.series_id && post.series
        ? {
            title: post.series.title,
            slug: post.series.slug,
            part: post.series_part_number || 0,
          }
        : null,
  } as PostFrontmatter // Cast because some fields might be missing compared to full PostFrontmatter
}

export const getAllSeriesSlugs = cache(async (): Promise<string[]> => {
  const supabase = createClient()
  const { data, error } = await supabase.from("series").select("slug").eq("status", "published")

  if (error) {
    console.error("Error fetching series slugs:", error.message)
    return []
  }
  return data.map((s) => s.slug)
})

export const getSeriesDetailsBySlug = cache(async (slug: string): Promise<DbSeriesType | null> => {
  const supabase = createClient()
  const { data: series, error } = await supabase
    .from("series")
    .select(`*, author:profiles (id, username, full_name)`)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error || !series) {
    // console.error(`Error fetching series details for ${slug}:`, error?.message) // Less noisy for notFound
    return null
  }
  return series
})

export const getPostsForSeriesBySlug = cache(async (seriesSlug: string): Promise<PostFrontmatter[]> => {
  const supabase = createClient()
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles (id, username, full_name),
      tags (id, name, slug),
      series!inner (id, title, slug)
    `)
    .eq("series.slug", seriesSlug)
    .eq("status", "published")
    .order("series_part_number", { ascending: true })

  if (error) {
    console.error(`Error fetching posts for series ${seriesSlug}:`, error.message)
    return []
  }
  // Use the more complete dbPostToPostFrontmatter from lib/posts.ts if circular dependency is not an issue
  // For now, using a local simplified one or ensure the one from posts.ts is correctly imported and used.
  // This requires careful handling of imports if dbPostToPostFrontmatter is in lib/posts.ts
  // For simplicity here, let's assume a slightly adapted version or direct mapping:
  return posts.map(dbPostToPostFrontmatterForSeries)
})

export const getAllSeriesWithPostCount = cache(async (includeUnpublished = false): Promise<SeriesListingInfo[]> => {
  const supabase = createClient()

  // 1) Grab every PUBLISHED post that has a series_id
  const { data: postRows, error: postErr } = await supabase
    .from("posts")
    .select("series_id, published_at")
    .eq("status", "published")
    .not("series_id", "is", null)

  if (postErr) {
    console.error("Error fetching series posts:", postErr.message)
    return []
  }

  // Build: Map<series_id, { postCount, lastUpdated }>
  const stats = new Map<string, { postCount: number; lastUpdated: string }>()

  postRows.forEach((row: any) => {
    const id = row.series_id
    if (!id) return
    if (!stats.has(id)) {
      stats.set(id, { postCount: 0, lastUpdated: row.published_at })
    }
    const entry = stats.get(id)!
    entry.postCount += 1
    if (row.published_at && new Date(row.published_at) > new Date(entry.lastUpdated)) {
      entry.lastUpdated = row.published_at
    }
  })

  const seriesIds = Array.from(stats.keys())
  if (seriesIds.length === 0) return []

  // 2) Fetch series rows in bulk
  const { data: seriesRows, error: seriesErr } = await supabase
    .from("series")
    .select("id, slug, title, description, hero_image_url, status, created_at")
    .in("id", seriesIds)

  if (seriesErr) {
    console.error("Error fetching series details:", seriesErr.message)
    return []
  }

  // 3) Merge & shape into SeriesListingInfo[]
  let result: SeriesListingInfo[] = seriesRows.map((s: any) => {
    const stat = stats.get(s.id)!
    return {
      slug: s.slug,
      title: s.title,
      description: s.description || `A collection of posts about ${s.title}.`,
      heroImage: s.hero_image_url,
      postCount: stat.postCount,
      lastUpdated: stat.lastUpdated ?? s.created_at,
      status: s.status,
    }
  })

  if (!includeUnpublished) {
    result = result.filter((s) => s.status === "published")
  }

  // Sort newest first
  return result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
})

export const getFeaturedSeriesFromDb = cache(async (limit = 3): Promise<SeriesListingInfo[]> => {
  const allSeries = await getAllSeriesWithPostCount(false) // Get only published series
  // Add any specific "featured" logic here if series can be marked as featured in the DB
  // For now, it takes the latest updated series with published posts.
  return allSeries.filter((s) => s.postCount > 0).slice(0, limit)
})
