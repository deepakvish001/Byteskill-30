import { remark } from "remark"
import html from "remark-html"
import remarkGfm from "remark-gfm"
import { createClient } from "@/lib/supabase/server"
import type { PostFrontmatter, DbPost as DbPostType } from "./types"
import { cache } from "react"
import { siteConfig } from "./site-config"

export interface UniqueTag {
  tag: string
  displayName: string
  count: number
}

function dbPostToPostFrontmatter(post: DbPostType): PostFrontmatter {
  const authorName = post.author?.full_name || post.author?.username || siteConfig.author.name
  const authorUrl = post.author?.username ? `${siteConfig.url}/u/${post.author.username}` : siteConfig.author.url

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    date: post.published_at || post.created_at,
    updated_at: post.updated_at || post.published_at || post.created_at,
    tags: post.tags?.map((t: any) => t.slug) || [],
    originalTags: post.tags?.map((t: any) => t.name) || [],
    description: post.description || "",
    isPublished: post.status === "published",
    featured: post.featured || false,
    heroImage: post.hero_image_url
      ? post.hero_image_url.startsWith("http")
        ? post.hero_image_url
        : `${siteConfig.url}${post.hero_image_url}`
      : undefined,
    thumbnailImage: post.thumbnail_image_url,
    content: post.content || "",
    author: { name: authorName, url: authorUrl },
    series:
      post.series_id && post.series
        ? {
            title: post.series.title,
            slug: post.series.slug,
            part: post.series_part_number || 0,
          }
        : null,
    prevPost: null,
    nextPost: null,
    readTime: post.content ? Math.ceil(post.content.split(/\s+/).length / 200) + " min read" : "N/A",
    view_count: post.view_count || 0, // Added view_count
  }
}

const POST_SELECT_QUERY = `
  id, slug, title, content, description, hero_image_url, thumbnail_image_url,
  status, featured, published_at, created_at, updated_at, series_part_number,
  author_id, series_id, view_count,
  author:profiles (id, username, full_name, avatar_url),
  tags (id, name, slug),
  series:series!series_id (id, title, slug, description, hero_image_url)
`

export const getAllPosts = cache(async (includeUnpublished = false): Promise<PostFrontmatter[]> => {
  const supabase = createClient()
  let query = supabase
    .from("posts")
    .select(POST_SELECT_QUERY)
    .order("published_at", { ascending: false, nullsFirst: true })

  if (!includeUnpublished) {
    query = query.eq("status", "published")
  }

  const { data: posts, error } = await query

  if (error) {
    console.error("Error fetching all posts:", error.message)
    return []
  }
  return posts.map(dbPostToPostFrontmatter)
})

export const getPostBySlug = cache(async (slug: string): Promise<PostFrontmatter | null> => {
  const supabase = createClient()
  const { data: post, error } = await supabase.from("posts").select(POST_SELECT_QUERY).eq("slug", slug).single()

  if (error || !post) {
    return null
  }

  const postFrontmatter = dbPostToPostFrontmatter(post as DbPostType)

  if (post.series_id && post.series_part_number) {
    const { data: seriesPosts, error: seriesPostsError } = await supabase
      .from("posts")
      .select("slug, title, series_part_number")
      .eq("series_id", post.series_id)
      .eq("status", "published")
      .order("series_part_number", { ascending: true })

    if (seriesPostsError) {
      console.error("Error fetching series posts for prev/next:", seriesPostsError.message)
    } else if (seriesPosts) {
      const currentIndex = seriesPosts.findIndex((p) => p.slug === slug)
      if (currentIndex > 0) {
        postFrontmatter.prevPost = {
          slug: seriesPosts[currentIndex - 1].slug,
          title: seriesPosts[currentIndex - 1].title,
        }
      }
      if (currentIndex < seriesPosts.length - 1 && currentIndex !== -1) {
        postFrontmatter.nextPost = {
          slug: seriesPosts[currentIndex + 1].slug,
          title: seriesPosts[currentIndex + 1].title,
        }
      }
    }
  }

  return postFrontmatter
})

export const getFeaturedPosts = cache(async (limit = 3): Promise<PostFrontmatter[]> => {
  const supabase = createClient()
  const { data: posts, error } = await supabase
    .from("posts")
    .select(POST_SELECT_QUERY)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching featured posts:", error.message)
    return []
  }
  return posts.map(dbPostToPostFrontmatter)
})

export const getPostsByTag = cache(async (tagSlug: string): Promise<PostFrontmatter[]> => {
  const supabase = createClient()
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      ${POST_SELECT_QUERY.replace("tags (id, name, slug)", "tags!inner (id, name, slug)")}
    `)
    .eq("tags.slug", tagSlug)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    console.error(`Error fetching posts for tag ${tagSlug}:`, error.message)
    return []
  }
  return posts.map(dbPostToPostFrontmatter)
})

export async function getPostContentHtml(slug: string): Promise<string> {
  const post = await getPostBySlug(slug)
  if (!post || !post.content) {
    return ""
  }
  const processedContent = await remark().use(html).use(remarkGfm).process(post.content)
  return processedContent.toString()
}

export function getRelatedPosts(currentPostSlug: string, allPosts: PostFrontmatter[], count = 3): PostFrontmatter[] {
  const currentPost = allPosts.find((post) => post.slug === currentPostSlug)
  if (!currentPost || !currentPost.tags || currentPost.tags.length === 0) {
    return []
  }
  const related = allPosts
    .filter((post) => post.slug !== currentPostSlug && post.isPublished)
    .map((post) => {
      const commonTags = post.tags.filter((tag) => currentPost.tags.includes(tag))
      return { ...post, commonTagsCount: commonTags.length }
    })
    .filter((post) => post.commonTagsCount > 0)
    .sort((a, b) => {
      if (b.commonTagsCount !== a.commonTagsCount) {
        return b.commonTagsCount - a.commonTagsCount
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  return related.slice(0, count)
}

export const getAllUniqueTags = cache(async (includeUnpublished = false): Promise<UniqueTag[]> => {
  const posts = await getAllPosts(includeUnpublished)
  const map = new Map<string, { displayName: string; count: number }>()
  for (const post of posts) {
    if (!post.tags || post.tags.length === 0) continue
    post.tags.forEach((slug, idx) => {
      const rawName = post.originalTags && post.originalTags[idx] ? post.originalTags[idx] : slug.replace(/-/g, " ")
      const entry = map.get(slug) ?? { displayName: rawName, count: 0 }
      entry.count += 1
      map.set(slug, entry)
    })
  }
  return Array.from(map.entries())
    .map(([tag, { displayName, count }]) => ({
      tag,
      displayName,
      count,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

export const getMostViewedPosts = cache(async (limit = 5): Promise<PostFrontmatter[]> => {
  const supabase = createClient()
  const { data: posts, error } = await supabase
    .from("posts")
    .select(POST_SELECT_QUERY)
    .eq("status", "published")
    .order("view_count", { ascending: false, nullsLast: true })
    .limit(limit)

  if (error) {
    console.error("Error fetching most viewed posts:", error.message)
    return []
  }
  return posts.map(dbPostToPostFrontmatter)
})
